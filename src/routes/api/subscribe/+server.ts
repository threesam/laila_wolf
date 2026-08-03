import { env } from '$env/dynamic/private'
import { error, json } from '@sveltejs/kit'
import type { RequestEvent, RequestHandler } from './$types'
import { guardSubmission, isRateLimited } from '$lib/server/subscribe-guard'
import { HONEYPOT_FIELD } from '$lib/honeypot'

function clientIp(event: Pick<RequestEvent, 'request' | 'getClientAddress'>): string {
	try {
		return event.getClientAddress() || 'unknown'
	} catch {
		// Some adapters have no address to give; the proxy header is the fallback.
		// Best-effort only — a raw header is caller-supplied and spoofable, so a
		// determined bot can rotate it into fresh buckets. The platform address is
		// the trustworthy one; this is the degraded path, not the normal one.
		return event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
	}
}

export const POST: RequestHandler = async (event) => {
	// Before the body is read at all. Parsing first meant a flood of huge or
	// malformed bodies bought parse work before anything throttled it, and an
	// unparseable body was answered without ever being counted.
	if (isRateLimited(clientIp(event))) error(429, 'too many requests')

	// Unparseable bodies fall through to the guard as an empty submission rather
	// than getting their own early return, so every request takes the same path.
	const body = await event.request.json().catch(() => null)
	// `name` is deliberately not read. Nothing sends it — SubscribeForm posts the
	// address and the honeypot and nothing else — so the only way to populate it
	// was a direct API call. That made it unvalidated, unbounded,
	// attacker-controlled text, stored in listmonk and rendered into its email
	// templates. The address local-part is all it ever supplied.
	const fields = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>

	const verdict = guardSubmission({
		email: fields['email'],
		honeypot: fields[HONEYPOT_FIELD]
	})
	if (!verdict.pass) {
		// A silent rejection answers exactly like a success — same status, same
		// body, no listmonk call. Reserved for the filled honeypot, which no real
		// visitor can trip; everything else answers visibly so a person who hits
		// it can recover.
		if (verdict.silent) return json({ ok: true })
		error(verdict.status, verdict.message)
	}

	const url = env.LISTMONK_URL
	const listUuid = env.LISTMONK_LIST_UUID
	if (!url || !listUuid) error(500, 'newsletter not configured')

	const res = await fetch(`${url.replace(/\/$/, '')}/api/public/subscription`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			email: verdict.email,
			name: verdict.email.split('@')[0],
			list_uuids: [listUuid]
		})
	})

	if (!res.ok) {
		const text = await res.text().catch(() => '')
		console.error('listmonk', res.status, text)
		error(502, 'newsletter signup failed')
	}

	return json({ ok: true })
}
