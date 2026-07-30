import type { RequestHandler } from './$types'
import { canonical } from '$lib/utils/site'

export const prerender = true

export const GET: RequestHandler = () => {
	const urls = [
		{ loc: canonical('/'), priority: 1 },
		{ loc: canonical('/about'), priority: 0.8 }
	]

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(({ loc, priority }) => `  <url><loc>${loc}</loc><priority>${priority}</priority></url>`)
	.join('\n')}
</urlset>
`

	return new Response(body, {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	})
}
