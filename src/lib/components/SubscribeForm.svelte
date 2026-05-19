<script lang="ts">
	import { fly } from 'svelte/transition'

	let { endpoint = '/api/subscribe' }: { endpoint?: string } = $props()

	let email = $state('')
	let status = $state<'idle' | 'submitting' | 'ok' | 'error'>('idle')
	let message = $state('')

	async function submit(e: SubmitEvent) {
		e.preventDefault()
		if (status === 'submitting') return
		status = 'submitting'
		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email }),
			})
			if (!res.ok) throw new Error(String(res.status))
			status = 'ok'
			message = 'Email confirmation sent — check your spam folder.'
			setTimeout(() => {
				email = ''
				status = 'idle'
				message = ''
			}, 4000)
		} catch (err) {
			console.error(err)
			status = 'error'
			message = 'Something went wrong — try again later.'
		}
	}
</script>

<form
	class="flex max-w-full flex-grow flex-col gap-10 lg:flex-row lg:gap-0"
	onsubmit={submit}
>
	<label class="relative" for="email">
		<input
			type="email"
			name="email"
			id="email"
			required
			placeholder="enter email"
			bind:value={email}
			disabled={status === 'submitting'}
			class="bg-dark w-full rounded-none border-2 border-gray-300 p-5 text-white placeholder:text-gray-300 focus:border-pink-300 focus:outline-none focus:placeholder:text-gray-300/60"
		/>
		{#if message}
			<span class="bg-dark absolute -bottom-8 left-0 w-max" in:fly={{ x: -30 }} out:fly={{ x: 30 }}
				>{message}</span
			>
		{/if}
	</label>
	<button
		type="submit"
		disabled={status === 'submitting'}
		class="text-dark border-2 border-gray-300 bg-gray-300 p-5 disabled:opacity-60 lg:border-none lg:pl-5"
	>
		{status === 'submitting' ? '…' : 'subscribe'}
	</button>
</form>
