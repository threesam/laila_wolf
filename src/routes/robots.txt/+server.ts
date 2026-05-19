import type { RequestHandler } from './$types'

export const prerender = true

const SITE = 'https://lailawolf.com'

export const GET: RequestHandler = () => {
	const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`
	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	})
}
