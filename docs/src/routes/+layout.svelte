<script lang="ts">
	import '../app.css';
	import { Header, Sidebar, CodeCopyEnhancer, TwoslashEnhancer } from '#lib/components/index.ts';
	import { afterNavigate } from '$app/navigation';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
	let mainEl: HTMLElement | null = null;

	afterNavigate(({ shallow, type, to }) => {
		if (shallow && type === 'goto') return;

		// The page scrolls inside <main>, so an address with a #hash (a case id such as #P4, a
		// heading) is scrolled to here; the browser's own jump comes before the page has hydrated.
		const id = to?.url.hash.slice(1);
		const target = id ? mainEl?.querySelector(`#${CSS.escape(decodeURIComponent(id))}`) : null;
		if (target) {
			target.scrollIntoView({ behavior: 'auto' });
			return;
		}

		// A first load starts at the top already, and the reader may have scrolled the prerendered
		// page before it hydrated: resetting then threw them back to the top.
		if (type === 'enter') return;
		mainEl?.scrollTo({ top: 0, left: 0, behavior: 'auto' });
	});
</script>

<div class="h-screen flex flex-col">
	<Header />
	<div class="flex-1 min-h-0 overflow-hidden">
		<div class="h-full min-h-0 flex gap-10 px-4 md:px-6">
			<aside class="hidden lg:block w-64 shrink-0 min-h-0 py-8">
				<div class="h-full min-h-0 overflow-y-auto overscroll-contain pr-2">
					<Sidebar />
				</div>
			</aside>
			<main bind:this={mainEl} class="flex-1 min-w-0 min-h-0 overflow-y-auto overscroll-contain">
				<div class="w-full max-w-5xl py-8">
					{@render children()}
				</div>
			</main>
		</div>
	</div>
</div>

<CodeCopyEnhancer />
<TwoslashEnhancer />
