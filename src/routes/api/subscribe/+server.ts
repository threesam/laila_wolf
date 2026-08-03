import { env } from '$env/dynamic/private'
import { error, json } from '@sveltejs/kit'
import type { RequestEvent, RequestHandler } from './$types'
import { guardSubmission } from '$lib/server/subscribe-guard'

function clientIp(event: Pick<RequestEvent, 'request' | 'getClientAddress'>): string {
	try {
		return event.getClientAddress() || 'unknown'
	} catch {
		// Some adapters have no address to give; the proxy header is the fallback.
		return event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
	}
}

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json().catch(() => null)
	if (!body || typeof body !== 'object') error(400, 'invalid body')

	// `name` is deliberately not read from the body. Nothing sends it —
	// SubscribeForm posts email, company and elapsedMs and nothing else — so the
	// only way to populate it was a direct API call. That made it unvalidated,
	// unbounded, attacker-controlled text, stored in listmonk and rendered into
	// its email templates. The address local-part is all it ever supplied.
	const { email, company, elapsedMs } = body as {
		email?: string
		company?: string
		elapsedMs?: number
	}

	const verdict = guardSubmission({ email, company, elapsedMs, ip: clientIp(event) })
	if (!verdict.pass) {
		// A silent rejection answers exactly like a success — same status, same
		// body, no listmonk call. A bot that gets a distinguishable response
		// learns which layer caught it and tunes around it.
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
