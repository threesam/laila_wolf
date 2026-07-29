import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
	projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
	dataset: import.meta.env.VITE_SANITY_DATASET,
	apiVersion: '2021-10-21',
	// The live API is metered and returns 402 once the plan's request quota is hit,
	// which took this site down. The CDN has its own far larger allowance and kept
	// serving throughout. Content here changes rarely, so stale-by-seconds is fine.
	useCdn: true
})

const builder = imageUrlBuilder(client)

export const urlFor = (source: string) => {
	return builder.image(source)
}
