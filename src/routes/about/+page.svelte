<script lang="ts">
	import PortableText from '$lib/components/PortableText.svelte'
	import Sketch from '$lib/components/Sketch.svelte'
	import SEO from 'svelte-seo'
	import { urlFor } from '$lib/utils/sanity'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	let founder = $derived(data.settings.founders?.[0])
</script>

<SEO title="About — Laila Wolf" description="About Laila Wolf." />

<!-- ABOUT HERO — sketch background + pink-outlined title block, 50vh -->
<section class="relative grid h-[50vh] w-full place-content-center">
	<h1
		class="bg-dark relative z-10 grid place-content-center p-5 text-4xl font-bold tracking-widest text-gray-300 shadow-md shadow-pink-200 lg:p-10 lg:text-7xl"
	>
		About
	</h1>
	<div class="absolute inset-0 rotate-180 overflow-hidden">
		<Sketch />
	</div>
</section>

<!-- IMAGE + QUOTE — 50/50 row on desktop, column on mobile -->
<section class="flex w-full flex-col lg:flex-row">
	{#if founder?.image?.asset?.url}
		<figure class="aspect-square w-full bg-pink-200 lg:aspect-auto lg:w-1/2">
			<img
				class="h-full w-full object-cover grayscale"
				src={urlFor(founder.image.asset.url).size(1200, 1200).auto('format').url()}
				alt="Laila Wolf"
				width="1200"
				height="1200"
				loading="lazy"
				decoding="async"
			/>
		</figure>
	{/if}

	{#if data.settings.body}
		<div class="bg-gradient-3 text-dark flex w-full items-center px-5 py-16 sm:p-10 lg:w-1/2 lg:p-20">
			<div class="quote-body w-full">
				<PortableText blocks={data.settings.body} />
			</div>
		</div>
	{/if}
</section>

<!-- BIO + back link -->
<section class="mx-auto max-w-3xl px-5 py-16 lg:py-24">
	<a class="text-light/60 hover:text-light text-sm uppercase tracking-widest" href="/">← back</a>

	{#if founder?.bio}
		<div class="text-light/90 mt-10">
			<PortableText blocks={founder.bio} />
		</div>
	{/if}
</section>

<style>
	.quote-body :global(p) {
		font-style: italic;
		font-size: 1.125rem;
		line-height: 1.7;
	}
	@media (min-width: 1024px) {
		.quote-body :global(p) {
			font-size: 1.375rem;
		}
	}
</style>
