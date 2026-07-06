<script lang="ts">
	import '../app.css'
	import { dev } from '$app/environment'
	import { inject } from '@vercel/analytics'
	import { page } from '$app/stores'
	import JsonLd from '$lib/components/JsonLd.svelte'
	import { optimize } from '$lib/utils/img'
	import { canonical, SITE_URL } from '$lib/utils/site'
	import { trackEvent } from '$lib/utils/umami'
	import type { LayoutData } from './$types'
	import type { Snippet } from 'svelte'

	const SFW_URL = 'https://skeletonflowersandwater.com'
	// Sanity stores `hostname` as a bare slug ('lailawolf', not 'lailawolf.com').
	const DEFAULT_HOSTNAME = 'lailawolf'

	let { data, children }: { data: LayoutData; children: Snippet } = $props()

	inject({ mode: dev ? 'development' : 'production' })

	// One delegated listener covers every external link on every page (the
	// about-page filmography renders via PortableText, so per-element attrs
	// can't reach it). Elements already tagged with data-umami-event opt out
	// to avoid double-counting (e.g. SocialLinks).
	function trackOutbound(e: MouseEvent) {
		const a = (e.target as Element | null)?.closest?.('a')
		if (!a || a.closest('[data-umami-event]')) return
		if (!a.href?.startsWith('http') || a.host === location.host) return
		trackEvent('outbound-click', { url: a.href })
	}

	let founder = $derived(data?.settings?.founders?.[0])
	let heroImage = $derived(optimize(data?.settings?.image?.asset?.url, { w: 1200 }))
	let pageUrl = $derived(canonical($page.url.pathname))

	// sameAs lists off-site profiles only — strip the site's own hostname so
	// search engines don't see a self-reference as a peer profile.
	let externalLinks = $derived.by(() => {
		const own = data?.settings?.hostname ?? DEFAULT_HOSTNAME
		return (founder?.links ?? [])
			.map((l: { href: string }) => l.href.trim())
			.filter((href: string) => {
				try {
					return !new URL(href).hostname.startsWith(own)
				} catch {
					return false
				}
			})
	})

	let personLd = $derived({
		'@type': 'Person',
		name: 'Laila Wolf',
		url: SITE_URL,
		image: heroImage,
		jobTitle: 'Filmmaker',
		description: data?.settings?.description ?? 'Filmmaker. Romance with something underneath.',
		knowsAbout: ['Filmmaking', 'Screenwriting', 'Directing', 'Producing'],
		...(founder?.contact ? { email: founder.contact } : {}),
		sameAs: externalLinks,
		worksFor: {
			'@type': 'Organization',
			name: 'Skeleton Flowers and Water',
			url: SFW_URL,
		},
	})
</script>

<svelte:head>
	<link rel="canonical" href={pageUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	{#if heroImage}
		<meta property="og:image" content={heroImage} />
		<meta name="twitter:image" content={heroImage} />
	{/if}
</svelte:head>

<svelte:document onclick={trackOutbound} />

<JsonLd data={personLd} />

{@render children()}
