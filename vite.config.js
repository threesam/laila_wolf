import adapter from '@sveltejs/adapter-vercel'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			preprocess: [vitePreprocess()],
			adapter: adapter({
				// Pin the function runtime to the Node LTS line rather than inheriting
				// the adapter's default, which moves when the adapter is bumped. This
				// matches what is already deployed, so it locks behaviour in place
				// rather than changing it.
				runtime: 'nodejs24.x'
			})
		})
	]
})
