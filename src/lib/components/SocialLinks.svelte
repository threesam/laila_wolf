<script lang="ts">
	import type { Component } from 'svelte'
	import { scale } from 'svelte/transition'

	interface Link {
		title: string
		href: string
	}

	let { color = '#b7c6af', size = 69, links = [] }: { color?: string; size?: number; links?: Link[] } = $props()

	import Backstage from './icons/Backstage.svelte'
	import Facebook from './icons/Facebook.svelte'
	import Imdb from './icons/Imdb.svelte'
	import Instagram from './icons/Instagram.svelte'
	import LinkedIn from './icons/LinkedIn.svelte'
	import TikTok from './icons/TikTok.svelte'
	import Website from './icons/Website.svelte'
	import Youtube from './icons/Youtube.svelte'
	import Message from './icons/Message.svelte'

	const options: { title: string; component: Component<{ color?: string; width?: number; height?: number }> }[] = [
		{ title: 'facebook', component: Facebook },
		{ title: 'backstage', component: Backstage },
		{ title: 'imdb', component: Imdb },
		{ title: 'instagram', component: Instagram },
		{ title: 'linkedin', component: LinkedIn },
		{ title: 'tiktok', component: TikTok },
		{ title: 'website', component: Website },
		{ title: 'youtube', component: Youtube },
		{ title: 'contact', component: Message }
	]

	const getIconComponent = (title: string) =>
		options.find((option) => option.title === title)?.component
</script>

{#if links?.length}
	<div class="grid grid-cols-3 items-center justify-between gap-5 lg:flex">
		{#each links as { href, title }, i}
			{@const IconComponent = getIconComponent(title)}
			<a
				style={`color: ${color};`}
				class="flex items-center overflow-hidden rounded-md transition duration-300 hover:scale-90"
				in:scale={{ delay: (i + 1) * 100 + 500, start: 0 }}
				{href}
				aria-label={title}
			>
				{#if IconComponent}
					<IconComponent {color} width={size} height={size} />
				{/if}
			</a>
		{/each}
	</div>
{/if}
