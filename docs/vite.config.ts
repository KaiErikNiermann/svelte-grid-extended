import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex, type MdsvexOptions } from 'mdsvex';
import rehypeSlug from 'rehype-slug';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { highlight } from './tooling/highlight.ts';
import { rehypeTableScroll } from './tooling/rehype-table-scroll.ts';

const mdsvexOptions: MdsvexOptions = {
	extensions: ['.md', '.svx'],
	highlight: { highlighter: highlight },
	rehypePlugins: [rehypeSlug, rehypeTableScroll]
};

// SvelteKit wants `paths.base` to be empty or root-relative; BASE_PATH comes from the deploy
// workflow, so reject a malformed value here rather than ship a site with broken links.
const basePath = (): '' | `/${string}` => {
	if (process.argv.includes('dev')) return '';
	const base = process.env.BASE_PATH ?? '';
	if (base === '' || base.startsWith('/')) return base as '' | `/${string}`;
	throw new Error(`BASE_PATH must be empty or start with "/", got ${JSON.stringify(base)}`);
};

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(projectRoot, 'src') + path.sep;

export default defineConfig({
	plugins: [
		sveltekit({
			extensions: ['.svelte', '.md', '.svx'],
			preprocess: [vitePreprocess(), mdsvex(mdsvexOptions)],
			dynamicCompileOptions: ({ filename }) => {
				if (filename && filename.startsWith(srcRoot)) {
					return { runes: true };
				}
			},
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '404.html',
				precompress: false,
				strict: true
			}),
			paths: {
				base: basePath()
			}
		})
	],
	server: {
		port: 5174
	}
});
