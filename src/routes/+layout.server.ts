import { client } from '$lib/utils/sanity'
import fallback from '$lib/data/settings.fallback.json'

const QUERY = `*[_type == 'siteSettings' && hostname == 'lailawolf'][0]{
	...,
	image{
		...,
		asset->
	},
	icons[]{
		asset->
	},
	founders[]->{
		...,
		image{
			...,
			asset->
		},
		imageGallery[]{
			...
			asset->
		},
	}
}`

export async function load() {
	// This site went down for a week when Sanity's request quota tripped and the
	// live API started returning 402 — an unhandled throw here 500s every page.
	// The content is one image and a few text fields, so it is committed as a
	// snapshot and served whenever Sanity can't answer. Stale beats offline.
	try {
		const settings = await client.fetch(QUERY)
		if (settings) return { settings, stale: false }
		console.warn('[layout] Sanity returned no siteSettings — using committed fallback')
	} catch (err) {
		console.warn('[layout] Sanity fetch failed, using committed fallback:', err)
	}
	return { settings: fallback, stale: true }
}
