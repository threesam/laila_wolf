<script lang="ts">
	import PortableText from '$lib/components/PortableText.svelte'
	import SEO from 'svelte-seo'
	import Sketch from '$lib/components/Sketch.svelte'
	import SocialLinks from '$lib/components/SocialLinks.svelte'
	import SubscribeForm from '$lib/components/SubscribeForm.svelte'
	import { urlFor } from '$lib/utils/sanity'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// filter out circular reference to this page
	const links = data.settings.founders[0].links.filter(
		({ href }: { href: string }) => !new URL(href).hostname.startsWith(data.settings.hostname)
	)

	if (data.settings.founders[0].contact) {
		links.push({
			title: 'contact',
			href: 'mailto:' + data.settings.founders[0].contact
		})
	}
</script>

<SEO
	title="Laila Wolf"
	description={data.settings.description ?? 'The skinny on Laila Wolf'}
	openGraph={{
		title: 'Laila Wolf',
		description: data.settings.description ?? 'The skinny on Laila Wolf',
		type: 'website',
		images: [{ url: data.settings.image.asset.url }]
	}}
/>

<!-- HERO -->
<section id="hero" class="relative flex h-screen w-full items-center justify-center">
	<figure class="bg-dark absolute inset-0 h-full w-full p-5 sm:p-10 lg:p-20">
		<img
			class="h-full w-full border-2 object-cover"
			src={urlFor(data.settings.image.asset.url).auto('format').url()}
			alt="homepage hero"
		/>
	</figure>
	<div class=" bg-gradient-fade absolute inset-0 opacity-60"></div>
	<a class="z-0 w-full" href="#subscribe">
		<h1
			class="font-display flex w-full justify-center gap-10 font-bold transition-all duration-500
			lg:grid lg:grid-cols-2 lg:text-8xl lg:hover:gap-5"
		>
			<span class="text-gray-300 lg:text-right">Laila</span>
			<span class="text-gray-300 lg:text-left">Wolf</span>
		</h1>
	</a>
</section>

<!-- ABOUT SITE -->
<section class="grid w-full lg:grid-cols-2">
	<figure class="order-last bg-pink-200 lg:order-first">
		<img
			class="border-dark h-full w-full grayscale"
			src={urlFor(data.settings.founders[0].image.asset.url).size(900, 900).auto('format').url()}
			alt={data.settings.founders[0].image}
		/>
	</figure>
	<div class="bg-gradient-3 text-dark grid place-content-center p-5 py-20 sm:p-10 lg:p-20">
		<PortableText blocks={data.settings.body} />
	</div>
</section>

<!-- ABOUT AUTHOR - HEADER -->
<section class="w-full">
	<div class="relative grid place-content-center py-20">
		<h2
			class="bg-dark z-10 grid place-content-center p-5 text-4xl font-bold tracking-widest text-gray-300 shadow-md shadow-pink-200 lg:p-10
			lg:text-7xl"
		>
			About
		</h2>
		<div class="absolute inset-0 rotate-180 overflow-hidden">
			<Sketch />
		</div>
	</div>
</section>

<!-- ABOUT AUTHOR - TEXT -->
<div class="text-light bg-gradient-3 p-5 lg:pb-20">
	<PortableText blocks={data.settings.founders[0].bio} />
</div>

<!-- SUBSCRIBE + LINKS -->
<footer>
	<section class="max-w-screen relative flex w-full flex-col-reverse lg:grid lg:grid-cols-2">
		<div id="subscribe" class="relative grid aspect-square place-content-center">
			<Sketch />
			<div class="z-0">
				<SubscribeForm />
			</div>
		</div>
		<div class="grid aspect-square place-content-center bg-gray-300">
			<SocialLinks {links} size={60} color="#000" />
		</div>
	</section>
	<p class="text-light w-full border-t-2 border-pink-200 bg-black/70 p-5 text-center lg:p-10">
		© laila wolf 2013-{new Date().getFullYear()}
	</p>
</footer>
