<script lang="ts">
	let { data }: { data: Record<string, unknown> | Record<string, unknown>[] } = $props()

	let payload = $derived(Array.isArray(data) ? data : { '@context': 'https://schema.org', ...data })
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(payload).replace(/</g, '\\u003c')}</script>`}
</svelte:head>
