import { client } from '$lib/utils/sanity'
import fallback from '$lib/data/settings.fallback.json'

// Selects only the fields the pages actually render. The previous version used
// `...` spreads with bare `asset->` dereferences, which pulled whole asset
// documents (metadata, palette, LQIP blobs) plus a 5-image `imageGallery` and an
// `icons` array that nothing reads.
const QUERY = `*[_type == 'siteSettings' && hostname == 'lailawolf'][0]{
	description,
	hostname,
	body,
	image{ asset->{ url } },
	founders[]->{
		bio,
		contact,
		links,
		image{ asset->{ url } }
	}
}`

export async function load() {
	// This site went down for a week when Sanity's request quota tripped and the
	// live API started returning 402 — an unhandled throw here 500s every page.
	// The content is one image and a few text fields, so it is committed as a
	// snapshot and served whenever Sanity can't answer. Stale beats offline.
	try {
		const settings = await client.fetch(QUERY)
		if (settings) return { settings }
		console.warn('[layout] Sanity returned no siteSettings — using committed fallback')
	} catch (err) {
		console.warn('[layout] Sanity fetch failed, using committed fallback:', err)
	}
	return { settings: fallback }
}
