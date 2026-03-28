<script>
	import { Hr, Html, Text } from 'svelte-email'

	let { message = '' } = $props()
</script>

<Html lang="en">
	<Text>{message}</Text>
	<Hr />
</Html>
