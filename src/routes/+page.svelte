<script lang="ts">
	import SEO from 'svelte-seo'
	import Sketch from '$lib/components/Sketch.svelte'
	import SocialLinks from '$lib/components/SocialLinks.svelte'
	import SubscribeForm from '$lib/components/SubscribeForm.svelte'
	import { urlFor } from '$lib/utils/sanity'
	import { trackEvent } from '$lib/utils/umami'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Hover state for the hero. We track it in JS instead of using pure CSS
	// :hover because (a) after `scrollIntoView` the cursor doesn't move, so
	// CSS :hover never re-evaluates and the pink state sticks; (b) touch
	// devices fire a sticky synthetic :hover on tap that can't be cleared
	// by CSS alone.
	let heroHovered = $state(false)

	function activateHero(e: MouseEvent) {
		e.preventDefault()
		heroHovered = false
		trackEvent('hero-cta-click', { from: 'hero-name' })
		document.getElementById('subscribe')?.scrollIntoView({ behavior: 'smooth' })
		setTimeout(() => document.getElementById('email')?.focus({ preventScroll: true }), 700)
	}

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
	<!-- Textbox: pointer events drive heroHovered, which the image, scrim, and text below all react to. -->
	<div
		class="relative z-20 mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-10 py-12"
		onpointerenter={() => (heroHovered = true)}
		onpointerleave={() => (heroHovered = false)}
	>
		<a class="w-full" href="#subscribe" onclick={activateHero}>
			<h1
				class="font-display flex w-full justify-center gap-10 font-bold drop-shadow-lg lg:grid lg:grid-cols-2 lg:text-8xl"
			>
				<span
					class="transition-colors duration-[2000ms] ease-out lg:text-right {heroHovered
						? 'text-pink-300'
						: 'text-gray-300'}">Laila</span
				>
				<span
					class="transition-colors duration-[2000ms] ease-out lg:text-left {heroHovered
						? 'text-pink-300'
						: 'text-gray-300'}">Wolf</span
				>
			</h1>
		</a>
		<p
			class="text-center text-sm font-medium uppercase tracking-[0.3em] transition-colors duration-[2000ms] ease-out lg:text-base {heroHovered
				? 'text-pink-300'
				: 'text-white'}"
		>
			Filmmaker — ghostwriter
		</p>
	</div>

	<!-- Full-screen scrim — fades over 2s when textbox is hovered. -->
	<div
		class="bg-dark/60 pointer-events-none absolute inset-0 z-10 transition-opacity duration-[2000ms] ease-out {heroHovered
			? 'opacity-0'
			: 'opacity-100'}"
	></div>

	<!-- Image — behind everything: grayscale → color and transparent → pink border over 2s. -->
	<figure class="bg-dark absolute inset-0 z-0 h-full w-full p-5 sm:p-10 lg:p-20">
		<img
			class="h-full w-full border-2 object-cover {heroHovered
				? 'border-pink-300'
				: 'border-transparent grayscale'}"
			style="transition: filter 2000ms ease-out, border-color 2000ms ease-out;"
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
			<!-- Scrim sits between sketch animation and copy so text stays legible against the moving dots. -->
			<div class="bg-dark/60 pointer-events-none absolute inset-0"></div>
			<div class="relative z-10 mx-auto max-w-sm px-5 text-center">
				<p
					class="font-display mb-6 text-2xl text-white lg:text-3xl"
					style="text-shadow: 0 1px 12px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.95);"
				>
					just films, slowly. no noise.
				</p>
				<SubscribeForm />
			</div>
		</div>
		<div id="socials" class="grid aspect-square place-content-center bg-gray-300">
			<SocialLinks {links} size={60} color="#000" />
		</div>
	</section>
	<p class="text-light w-full border-t-2 border-pink-200 bg-black/70 p-5 text-center lg:p-10">
		© laila wolf 2013-{new Date().getFullYear()} ·
		<a class="underline underline-offset-4" href="/about">about</a>
	</p>
</footer>
