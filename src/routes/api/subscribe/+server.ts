import { env } from '$env/dynamic/private'
import { error, json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
	const { email, name } = (await request.json()) as { email?: string; name?: string }

	if (!email) error(400, 'email required')

	const url = env.LISTMONK_URL
	const listUuid = env.LISTMONK_LIST_UUID
	if (!url || !listUuid) error(500, 'newsletter not configured')

	const res = await fetch(`${url.replace(/\/$/, '')}/api/public/subscription`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			email,
			name: name ?? email.split('@')[0],
			list_uuids: [listUuid],
		}),
	})

	if (!res.ok) {
		const body = await res.text().catch(() => '')
		console.error('listmonk', res.status, body)
		error(502, 'newsletter signup failed')
	}

	return json({ ok: true })
}
