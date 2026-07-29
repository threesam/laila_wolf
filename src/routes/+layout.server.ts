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

// The pages index straight into settings.image.asset.url and
// settings.founders[0].links, so a document that exists but is incomplete — an
// unpublished founder reference, a half-finished edit — is truthy yet still
// throws when rendered. Because these routes are prerendered, that throw fails
// the build rather than one request, so check the shape the pages actually
// require instead of mere existence, and fall back when it doesn't hold.
function isRenderable(s: unknown): boolean {
	const doc = s as { image?: { asset?: { url?: string } }; founders?: { links?: unknown }[] }
	return Boolean(doc?.image?.asset?.url && doc?.founders?.[0]?.links)
}

export async function load() {
	// This site went down for a week when Sanity's request quota tripped and the
	// live API started returning 402 — an unhandled throw here 500s every page.
	// The content is one image and a few text fields, so it is committed as a
	// snapshot and served whenever Sanity can't answer. Stale beats offline.
	try {
		const settings = await client.fetch(QUERY)
		if (isRenderable(settings)) return { settings }
		console.warn('[layout] Sanity settings missing or incomplete — using committed fallback')
	} catch (err) {
		console.warn('[layout] Sanity fetch failed, using committed fallback:', err)
	}
	return { settings: fallback }
}
