<script>
	import { page } from '$app/state'
</script>

<svelte:head>
	<title>{page.status}</title>
</svelte:head>

<main>
	<h1>{page.status}</h1>

	<p>{page.error?.message}</p>
</main>
