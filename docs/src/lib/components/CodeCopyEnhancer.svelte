<script lang="ts">
	import { mount, onMount, tick } from 'svelte';
	import { Check, Copy } from 'lucide-svelte';
	import { afterNavigate } from '$app/navigation';

	const COPY_LABEL = 'Copy code';
	const COPIED_LABEL = 'Copied';

	function enhanceCodeBlocks() {
		const pres = document.querySelectorAll<HTMLPreElement>('pre.shiki');

		for (const pre of pres) {
			if (pre.closest('[data-codeblock]')) continue;
			// The code inside a twoslash hover popup is not a block of its own.
			if (pre.closest('.twoslash-popup-container')) continue;
			if (pre.querySelector('.code-copy-button')) continue;

			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'code-copy-button';
			button.setAttribute('aria-label', COPY_LABEL);
			button.setAttribute('title', COPY_LABEL);
			button.dataset.copied = 'false';
			// Both glyphs are in the button; the stylesheet shows the one the copied state asks for.
			mount(Copy, { target: button, props: { class: 'code-copy-icon code-copy-icon-idle' } });
			mount(Check, { target: button, props: { class: 'code-copy-icon code-copy-icon-done' } });

			button.addEventListener('click', async () => {
				const codeEl = pre.querySelector('code');
				const text = codeEl ? (codeEl.textContent ?? '') : (pre.textContent ?? '');
				try {
					await navigator.clipboard.writeText(text.trimEnd());
					button.dataset.copied = 'true';
					button.setAttribute('title', COPIED_LABEL);
					window.setTimeout(() => {
						button.dataset.copied = 'false';
						// Both glyphs are in the button; the stylesheet shows the one the copied state asks for.
						mount(Copy, { target: button, props: { class: 'code-copy-icon code-copy-icon-idle' } });
						mount(Check, {
							target: button,
							props: { class: 'code-copy-icon code-copy-icon-done' }
						});
						button.setAttribute('title', COPY_LABEL);
					}, 2000);
				} catch {
					// no-op: clipboard may be blocked
				}
			});

			pre.prepend(button);
		}
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

		afterNavigate(({ shallow, type }) => {
			if (shallow && type === 'goto') return;

			runEnhancer();
		});

		return () => {
			observer.disconnect();
		};
	});
</script>
