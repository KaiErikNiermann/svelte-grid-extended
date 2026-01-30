import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Use vitePreprocess for Svelte 5
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	}
};

export default config;
