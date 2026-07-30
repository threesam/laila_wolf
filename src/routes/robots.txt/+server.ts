import type { RequestHandler } from './$types'
import { SITE_URL } from '$lib/utils/site'

export const prerender = true

export const GET: RequestHandler = () => {
	const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`
	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	})
}
