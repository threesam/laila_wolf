<script>
	import { fly } from 'svelte/transition'

	let { endpoint = '/api/subscribe' } = $props()

	let isSubmitted = $state(false)
	let message = $state('')
	let email = $state('')

	async function handleSubmit(e) {
		e.preventDefault()
		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				body: JSON.stringify({ email })
			})

			if (response.status === 200) {
				message = 'Email Confirmation sent...'
				setTimeout(() => (isSubmitted = false), 1300)
				setTimeout(() => {
					isSubmitted = true
					message = '...so check that spam folder'
				}, 1500)
			} else {
				message = 'Uh oh, error'
			}

			isSubmitted = true
			setTimeout(() => {
				email = ''
				isSubmitted = false
			}, 3300)
		} catch (error) {
			console.error(error)
		}
	}
</script>

<form
	class="flex max-w-full flex-grow flex-col gap-10 lg:flex-row lg:gap-0"
	action={endpoint}
	method="post"
	onsubmit={handleSubmit}
>
	<label class="relative" for="email">
		<input
			type="email"
			name="email"
			id="email"
			placeholder="enter email"
			class="bg-dark w-full rounded-none border-2 border-gray-300 p-5 text-white placeholder:text-gray-300
			focus:border-pink-300 focus:outline-none focus:placeholder:text-gray-300/60"
			bind:value={email}
		/>
		{#if isSubmitted}
			<span class="bg-dark absolute -bottom-8 left-0 w-max" in:fly={{ x: -30 }} out:fly={{ x: 30 }}
				>{message}</span
			>
		{/if}
	</label>
	<button
		class="text-dark border-2 border-gray-300 bg-gray-300 p-5 lg:border-none lg:pl-5"
		type="submit"
	>
		subscribe
	</button>
</form>
