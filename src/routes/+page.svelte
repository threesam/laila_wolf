<script lang="ts">
	import SEO from 'svelte-seo'
	import Sketch from '$lib/components/Sketch.svelte'
	import SocialLinks from '$lib/components/SocialLinks.svelte'
	import SubscribeForm from '$lib/components/SubscribeForm.svelte'
	import { urlFor } from '$lib/utils/sanity'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// filter out circular reference to this page
	const links = data.settings.founders[0].links.filter(
		({ href }: { href: string }) => !new URL(href).hostname.startsWith(data.settings.hostname),
	)

	if (data.settings.founders[0].contact) {
		links.push({
			title: 'contact',
			href: 'mailto:' + data.settings.founders[0].contact,
		})
	}
</script>

<SEO
	title="Laila Wolf"
	description={data.settings.description ?? 'Filmmaker. Romance with something underneath.'}
	openGraph={{
		title: 'Laila Wolf',
		description: data.settings.description ?? 'Filmmaker.',
		type: 'website',
		images: [{ url: data.settings.image.asset.url }],
	}}
/>

<!-- HERO -->
<section
	id="hero"
	class="relative flex h-screen w-full items-center justify-center overflow-hidden"
>
	<!-- Textbox (peer + group): hovering here drives both the scrim fade and the image desaturation. -->
	<div
		class="peer group relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-10 py-12"
	>
		<div
			class="bg-dark/60 pointer-events-none absolute inset-0 transition-opacity duration-1000 ease-out group-hover:opacity-0"
		></div>
		<a
			class="relative w-full"
			href="#subscribe"
			onclick={(e) => {
				e.preventDefault()
				document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })
				setTimeout(() => document.getElementById('email')?.focus({ preventScroll: true }), 700)
			}}
		>
			<h1
				class="font-display flex w-full justify-center gap-10 font-bold drop-shadow-lg lg:grid lg:grid-cols-2 lg:text-8xl"
			>
				<span class="text-gray-300 lg:text-right">Laila</span>
				<span class="text-gray-300 lg:text-left">Wolf</span>
			</h1>
		</a>
		<p
			class="relative text-center text-sm font-medium uppercase tracking-[0.3em] text-white lg:text-base"
		>
			Filmmaker — romance with something underneath
		</p>
	</div>

	<!-- Image must be a sibling AFTER the peer so peer-hover propagates. -->
	<figure
		class="bg-dark absolute inset-0 z-0 h-full w-full p-5 sm:p-10 lg:p-20 peer-hover:[&_img]:grayscale-0"
	>
		<img
			class="h-full w-full border-2 object-cover grayscale transition-[filter] duration-1000 ease-out"
			src={urlFor(data.settings.image.asset.url).width(1600).auto('format').url()}
			alt="Laila Wolf"
			width="1600"
			height="2400"
			fetchpriority="high"
			decoding="sync"
		/>
	</figure>
</section>

<!-- SUBSCRIBE + LINKS -->
<footer>
	<section class="max-w-screen relative flex w-full flex-col-reverse lg:grid lg:grid-cols-2">
		<div id="subscribe" class="relative grid aspect-square place-content-center">
			<Sketch />
			<div class="z-0 mx-auto max-w-sm px-5 text-center">
				<h2 class="font-display text-light mb-2 text-3xl">Films, slowly.</h2>
				<p class="text-light mb-6 text-sm opacity-80">
					Release dates and the occasional dispatch. No noise.
				</p>
				<SubscribeForm />
			</div>
		</div>
		<div class="grid aspect-square place-content-center bg-gray-300">
			<SocialLinks {links} size={60} color="#000" />
		</div>
	</section>
	<p class="text-light w-full border-t-2 border-pink-200 bg-black/70 p-5 text-center lg:p-10">
		© laila wolf 2013-{new Date().getFullYear()} ·
		<a class="underline underline-offset-4" href="/about">about</a>
	</p>
</footer>
