<script lang="ts">
	import { PortableText } from '@portabletext/svelte'

	let { blocks = [] }: { blocks?: any[] } = $props()
</script>

<section class="portable-text mx-auto max-w-2xl">
	<PortableText value={blocks} />
</section>

<style lang="scss">
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
			@apply border-2 border-black bg-pink-200 p-5 text-sm text-dark sm:p-10 md:text-lg;
		}
	}
</style>
