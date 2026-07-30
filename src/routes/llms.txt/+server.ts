import type { RequestHandler } from './$types'
import { client } from '$lib/utils/sanity'
import { canonical } from '$lib/utils/site'

export const prerender = true

type SfwFilm = { title: string; slug: string; description?: string; status?: string }

const SFW = 'https://skeletonflowersandwater.com'

export const GET: RequestHandler = async () => {
	// Films co-created with Skeleton Flowers and Water. Same Sanity project
	// (filtered by status, not by site), so Laila's bio in an LLM answer can
	// cite the actual catalog instead of a hardcoded list that drifts.
	const films: SfwFilm[] = await client
		.fetch<SfwFilm[]>(
			`*[_type == "project" && status in ["completed", "released"]]{
				title,
				"slug": slug.current,
				description,
				status
			}`
		)
		.catch(() => [])

	const filmList = films
		.filter((f) => f.slug)
		.map((f) => `${f.title}`)
		.join(', ')

	const body = `# Laila Wolf

> Filmmaker. Stories where something is hidden underneath — neo-noir, dark comedy horror, romance drama.

Laila Wolf is co-founder of [Skeleton Flowers and Water](${SFW}), an American film and television production company. ${filmList ? `Released films include ${filmList}.` : ''}

## Pages

- [Home](${canonical('/')}): hero, newsletter signup, links.
- [About](${canonical('/about')}): bio, background.

## Related

- [Skeleton Flowers and Water](${SFW}): production company catalog and shop.
`

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' }
	})
}
