<script lang="ts">
	let { data }: { data: Record<string, unknown> } = $props()

	// Escape `<` (closes <script>), plus U+2028/U+2029 (valid JSON, but
	// terminate JS lines and would corrupt the inline <script>).
	const UNSAFE = new RegExp('[<\\u2028\\u2029]', 'g')

	let payload = $derived({ '@context': 'https://schema.org', ...data })
	let serialized = $derived(
		JSON.stringify(payload).replace(
			UNSAFE,
			(c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'),
		),
	)
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${serialized}</script>`}
</svelte:head>
