import type { RequestHandler } from './$types'

export const prerender = true

const SITE = 'https://lailawolf.com'

export const GET: RequestHandler = () => {
	const body = `# Laila Wolf

> Filmmaker. Stories where something is hidden underneath — neo-noir, dark comedy horror, romance drama.

Laila Wolf is co-founder of [Skeleton Flowers and Water](https://skeletonflowersandwater.com), an American film and television production company. Films include How Many Blind Mice, The Polka-Dot Dress, Quintessentially Unaware, and My Friend Whil.

## Pages

- [Home](${SITE}/): hero, newsletter signup, links
- [About](${SITE}/about): bio, background

## Related

- [Skeleton Flowers and Water](https://skeletonflowersandwater.com): production company catalog and shop
`

	return new Response(body, {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	})
}
