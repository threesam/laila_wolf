<script lang="ts">
	import { fly } from 'svelte/transition'
	import { trackEvent } from '$lib/utils/umami'

	let { endpoint = '/api/subscribe', inputId = 'email' }: { endpoint?: string; inputId?: string } =
		$props()

	let email = $state('')
	let status = $state<'idle' | 'submitting' | 'ok' | 'error'>('idle')
	let message = $state('')

	// Honeypot. Hidden from people, filled by anything walking the DOM.
	let company = $state('')

	// Set when the component initialises in the browser, so what the server
	// receives is an elapsed COUNT rather than a start time — see the note in
	// subscribe-guard.ts on why comparing browser clocks to the server's
	// silently drops visitors whose clock runs fast.
	const mountedAt = Date.now()

	// HTML5 valid + non-empty
	let isValid = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

	async function submit(e: SubmitEvent) {
		e.preventDefault()
		if (status === 'submitting' || !isValid) return
		status = 'submitting'
		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ email, company, elapsedMs: Date.now() - mountedAt })
			})
			if (!res.ok) throw new Error(String(res.status))
			status = 'ok'
			message = 'Email confirmation sent — check your spam folder.'
			trackEvent('newsletter-subscribe')
			setTimeout(() => {
				email = ''
				status = 'idle'
				message = ''
			}, 4000)
		} catch (err) {
			console.error(err)
			status = 'error'
			message = 'Something went wrong — try again later.'
			trackEvent('newsletter-error')
		}
	}
</script>

<form class="flex max-w-full flex-grow flex-col gap-10 lg:flex-row lg:gap-0" onsubmit={submit}>
	<!--
		Honeypot. Positioned off-screen rather than `display: none` or
		`hidden`, because the cheap bots skip anything trivially detectable as
		hidden and the whole point is that they fill it in. aria-hidden and
		tabindex="-1" keep it away from screen readers and the tab order, and
		autocomplete="off" stops a browser helpfully filling it for a real
		person — which would silently drop them.
	-->
	<div class="pointer-events-none absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
		<label for="{inputId}-company" aria-hidden="true">company</label>
		<input
			type="text"
			id="{inputId}-company"
			name="company"
			bind:value={company}
			tabindex="-1"
			autocomplete="off"
			aria-hidden="true"
		/>
	</div>
	<label class="relative" for={inputId}>
		<input
			type="email"
			name="email"
			id={inputId}
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
		data-umami-event="subscribe-click"
		disabled={status === 'submitting' || !isValid}
		class={`text-dark border-2 p-5 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 lg:pl-5 ${
			isValid && status === 'idle'
				? 'border-pink-300 bg-pink-300'
				: 'border-gray-300 bg-gray-300 lg:border-none'
		}`}
	>
		{status === 'submitting' ? '…' : 'subscribe'}
	</button>
</form>
