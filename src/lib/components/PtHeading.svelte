<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { BlockComponentProps } from '@portabletext/svelte'

	let { portableText, children }: { portableText: BlockComponentProps; children?: Snippet } =
		$props()

	// Same sizes as the base h1-h6 rules in app.css, keyed by the level the author
	// picked, so re-levelling a heading for the outline doesn't resize it.
	const size: Record<string, string> = {
		h1: 'text-5xl',
		h2: 'text-4xl',
		h3: 'text-3xl',
		h4: 'text-2xl',
		h5: 'text-xl',
		h6: 'text-lg'
	}

	let block = $derived(portableText.value as { style?: string; authoredStyle?: string })
	let tag = $derived(block.style ?? 'h2')
</script>

<svelte:element this={tag} class={size[block.authoredStyle ?? tag]}
	>{@render children?.()}</svelte:element
>
