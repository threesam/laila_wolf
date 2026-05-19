<script lang="ts">
	import PortableText from '$lib/components/PortableText.svelte'
	import SEO from 'svelte-seo'
	import { urlFor } from '$lib/utils/sanity'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	let founder = $derived(data.settings.founders?.[0])
</script>

<SEO title="About — Laila Wolf" description="About Laila Wolf." />

<section class="mx-auto max-w-3xl px-5 py-16 lg:py-24">
	<a class="text-light/60 hover:text-light text-sm uppercase tracking-widest" href="/">← back</a>

	<h1 class="font-display mt-6 text-5xl lg:text-7xl">Laila Wolf</h1>

	{#if founder?.image?.asset?.url}
		<figure class="my-10 aspect-square max-w-md overflow-hidden bg-pink-200">
			<img
				class="h-full w-full grayscale"
				src={urlFor(founder.image.asset.url).size(900, 900).auto('format').url()}
				alt="Laila Wolf"
				width="900"
				height="900"
				loading="lazy"
				decoding="async"
			/>
		</figure>
	{/if}

	{#if data.settings.body}
		<div class="text-light prose-invert mb-12">
			<PortableText blocks={data.settings.body} />
		</div>
	{/if}

	{#if founder?.bio}
		<div class="text-light/90">
			<PortableText blocks={founder.bio} />
		</div>
	{/if}
</section>
