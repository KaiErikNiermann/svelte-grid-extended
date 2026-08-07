// The docs site is fully static. Prerendering emits real HTML per route instead
// of leaning on the 404.html SPA fallback — which returned an HTTP 404 for every
// deep link — and makes SvelteKit crawl internal links at build time, so a broken
// route fails the docs build rather than shipping.
export const prerender = true;
