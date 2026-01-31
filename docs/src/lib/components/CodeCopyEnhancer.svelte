<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	const COPY_LABEL = 'Copy code';
	const COPIED_LABEL = 'Copied';

	function enhanceCodeBlocks() {
		const pres = document.querySelectorAll<HTMLPreElement>('pre.shiki');

		pres.forEach((pre) => {
			if (pre.closest('[data-codeblock]')) return;
			if (pre.querySelector('.code-copy-button')) return;

			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'code-copy-button';
			button.setAttribute('aria-label', COPY_LABEL);
			button.setAttribute('title', COPY_LABEL);
			button.dataset.copied = 'false';

			button.addEventListener('click', async () => {
				const codeEl = pre.querySelector('code');
				const text = codeEl ? codeEl.textContent ?? '' : pre.textContent ?? '';
				try {
					await navigator.clipboard.writeText(text.trimEnd());
					button.dataset.copied = 'true';
					button.setAttribute('title', COPIED_LABEL);
					window.setTimeout(() => {
						button.dataset.copied = 'false';
						button.setAttribute('title', COPY_LABEL);
					}, 2000);
				} catch {
					// no-op: clipboard may be blocked
				}
			});

			pre.prepend(button);
		});
	}

	async function runEnhancer() {
		await tick();
		enhanceCodeBlocks();
	}

	onMount(() => {
		const observer = new MutationObserver(() => {
			enhanceCodeBlocks();
		});

		observer.observe(document.body, {
			childList: true,
			subtree: true
		});

		runEnhancer();
		afterNavigate(() => {
			runEnhancer();
		});

		return () => {
			observer.disconnect();
		};
	});
</script>
