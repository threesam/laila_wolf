<script lang="ts">
	import { DefaultBlock, PortableText, type InputValue } from '@portabletext/svelte'
	import PtHeading from './PtHeading.svelte'
	import { relevelHeadings } from '$lib/utils/headings'

	let { blocks = [] as InputValue }: { blocks?: InputValue } = $props()

	let normalized = $derived(
		relevelHeadings(Array.isArray(blocks) ? blocks : [blocks]) as InputValue
	)

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

<style lang="postcss">
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
