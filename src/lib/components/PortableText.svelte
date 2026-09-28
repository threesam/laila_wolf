<script lang="ts">
	import { DefaultBlock, PortableText, type InputValue } from '@portabletext/svelte'
	import PtHeading from './PtHeading.svelte'

	let { blocks = [] as InputValue }: { blocks?: InputValue } = $props()

	type Block = { _type?: string; style?: string; children?: { text?: string }[] }

	// Sanity content here has an empty heading and headings that skip levels (the
	// bio's first heading is an h4 straight under the page h1). Both break the
	// outline screen readers navigate by. Drop empty headings and never let a
	// heading sit more than one level below the previous one (the page h1 counts);
	// PtHeading keeps the authored size so nothing moves visually.
	let normalized = $derived.by(() => {
		let prev = 1
		return (Array.isArray(blocks) ? blocks : [blocks]).flatMap((b) => {
			const block = b as Block
			const level = block._type === 'block' ? /^h([1-6])$/.exec(block.style ?? '')?.[1] : undefined
			if (!level) return [b]
			if (!block.children?.some((c) => c.text?.trim())) return []
			prev = Math.min(Number(level), prev + 1)
			return [{ ...b, style: `h${prev}`, authoredStyle: block.style }]
		}) as InputValue
	})

	const blockStyles = {
		normal: DefaultBlock,
		blockquote: DefaultBlock,
		h1: PtHeading,
		h2: PtHeading,
		h3: PtHeading,
		h4: PtHeading,
		h5: PtHeading,
		h6: PtHeading
	}
</script>

<section class="portable-text mx-auto max-w-2xl">
	<PortableText value={normalized} components={{ block: blockStyles }} />
</section>

<style lang="scss">
	@reference '../../app.css';

	:global(.portable-text) {
		:global(h1),
		:global(h2),
		:global(h3),
		:global(h4),
		:global(h5) {
			padding-bottom: 0.5rem;
			font-weight: 800;
			@apply text-pink-100;
		}
		:global(ul),
		:global(p) {
			@apply pb-5;
		}

		:global(a) {
			@apply border-b-2 border-pink-200 transition-all duration-100;

			&:hover {
				@apply border-transparent pb-1 text-pink-200;
			}
		}

		:global(blockquote) {
			@apply text-dark border-2 border-black bg-pink-200 p-5 text-sm sm:p-10 md:text-lg;
		}
	}
</style>
