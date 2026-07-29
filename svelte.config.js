import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [vitePreprocess()],

	kit: {
		adapter: adapter({
			// Pin the function runtime to the Node LTS line rather than inheriting
			// the adapter's default, which moves when the adapter is bumped. This
			// matches what is already deployed, so it locks behaviour in place
			// rather than changing it.
			runtime: 'nodejs24.x',
		}),
	},
}

export default config
