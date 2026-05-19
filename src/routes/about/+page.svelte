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

<!-- ABOUT HERO — sketch background + thin pink-outlined title block -->
<section class="relative w-full">
	<div class="relative grid place-content-center py-20">
		<h1
			class="bg-dark z-10 grid place-content-center p-5 text-4xl font-bold tracking-widest text-gray-300 shadow-md shadow-pink-200 lg:p-10 lg:text-7xl"
		>
			About
		</h1>
		<div class="absolute inset-0 rotate-180 overflow-hidden">
			<Sketch />
		</div>
	</div>
</section>

<section class="mx-auto max-w-3xl px-5 py-12 lg:py-16">
	<a class="text-light/60 hover:text-light text-sm uppercase tracking-widest" href="/">← back</a>

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
