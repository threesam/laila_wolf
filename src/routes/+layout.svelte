<script lang="ts">
	import '../app.css'
	import { dev } from '$app/environment'
	import { inject } from '@vercel/analytics'
	import { page } from '$app/stores'
	import JsonLd from '$lib/components/JsonLd.svelte'
	import { urlFor } from '$lib/utils/sanity'
	import type { LayoutData } from './$types'
	import type { Snippet } from 'svelte'

	const SITE = 'https://lailawolf.com'

	let { data, children }: { data: LayoutData; children: Snippet } = $props()

	inject({ mode: dev ? 'development' : 'production' })

	let founder = $derived(data?.settings?.founders?.[0])
	let heroImage = $derived(
		data?.settings?.image?.asset?.url
			? urlFor(data.settings.image.asset.url).width(1200).auto('format').url()
			: undefined,
	)
	let canonical = $derived(SITE + $page.url.pathname)

	let personLd = $derived({
		'@type': 'Person',
		name: 'Laila Wolf',
		url: SITE,
		image: heroImage,
		jobTitle: 'Filmmaker',
		description: data?.settings?.description ?? 'Filmmaker. Romance with something underneath.',
		sameAs: (founder?.links ?? [])
			.map((l: { href: string }) => l.href.trim())
			.filter((href: string) => {
				try {
					return !new URL(href).hostname.startsWith(data.settings.hostname)
				} catch {
					return false
				}
			}),
		worksFor: {
			'@type': 'Organization',
			name: 'Skeleton Flowers and Water',
			url: 'https://skeletonflowersandwater.com',
		},
	})
</script>

<svelte:head>
	<link rel="canonical" href={canonical} />
	<meta name="twitter:card" content="summary_large_image" />
	{#if heroImage}
		<meta property="og:image" content={heroImage} />
		<meta name="twitter:image" content={heroImage} />
	{/if}
</svelte:head>

<JsonLd data={personLd} />

{@render children()}
