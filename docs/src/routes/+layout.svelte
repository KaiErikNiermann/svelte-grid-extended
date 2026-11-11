<script lang="ts">
	import '../app.css';
	import { Header, Sidebar, CodeCopyEnhancer, TwoslashEnhancer } from '#lib/components/index.ts';

	interface Props {
		children: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

<!-- The document scrolls, not an inner pane: only then do phones offer pull-to-refresh and
     hide the address bar, and SvelteKit restores scroll and jumps to a #hash by itself. The
     header and the sidebar stay in view with position: sticky. -->
<div class="min-h-dvh flex flex-col">
	<Header />
	<div class="flex-1 flex gap-10 px-4 md:px-6">
		<aside
			class="hidden lg:block w-64 shrink-0 sticky top-14 self-start h-[calc(100dvh-3.5rem)] py-8"
		>
			<div class="h-full min-h-0 overflow-y-auto overscroll-contain pr-2">
				<Sidebar />
			</div>
		</aside>
		<main class="flex-1 min-w-0">
			<div class="w-full max-w-5xl py-8">
				{@render children()}
			</div>
		</main>
	</div>
</div>

<CodeCopyEnhancer />
<TwoslashEnhancer />
