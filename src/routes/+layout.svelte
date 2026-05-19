<script lang="ts">
	import '../app.css'
	import { dev } from '$app/environment'
	import { inject } from '@vercel/analytics'
	import type { Snippet } from 'svelte'

	let { children }: { children: Snippet } = $props()

	inject({ mode: dev ? 'development' : 'production' })
</script>

{@render children()}
