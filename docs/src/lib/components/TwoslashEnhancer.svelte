<script lang="ts">
	import { onMount } from 'svelte';
	import { computePosition, flip, offset, shift } from '@floating-ui/dom';

	// The popups are rendered at build time inside the code, so the code block's own
	// `overflow-x: auto` would clip them. They are `position: fixed` and placed here instead, which
	// also keeps them on screen on a narrow viewport. A mouse opens them by hovering, a finger or
	// pen by tapping, and Escape or a tap elsewhere closes them.
	const HOVER = '.twoslash-hover';
	const POPUP = '.twoslash-popup-container';
	const CLOSE_DELAY_MS = 120;
	const OFFSET_PX = 6;
	const EDGE_PX = 8;

	let open: HTMLElement | null = null;
	let closeTimer = 0;

	function popupOf(token: HTMLElement): HTMLElement | null {
		return token.querySelector<HTMLElement>(`:scope > ${POPUP}`);
	}

	function place(token: HTMLElement) {
		const popup = popupOf(token);
		if (!popup) return;
		void computePosition(token, popup, {
			strategy: 'fixed',
			placement: 'bottom-start',
			middleware: [offset(OFFSET_PX), flip(), shift({ padding: EDGE_PX })]
		}).then(({ x, y }) => {
			popup.style.insetInlineStart = `${x}px`;
			popup.style.insetBlockStart = `${y}px`;
		});
	}

	function show(token: HTMLElement) {
		window.clearTimeout(closeTimer);
		if (open === token) return;
		hide();
		open = token;
		token.dataset.open = 'true';
		place(token);
	}

	function hide() {
		window.clearTimeout(closeTimer);
		if (open) delete open.dataset.open;
		open = null;
	}

	function tokenOf(event: Event): HTMLElement | null {
		return event.target instanceof Element ? event.target.closest<HTMLElement>(HOVER) : null;
	}

	function onOver(event: PointerEvent) {
		if (event.pointerType !== 'mouse') return;
		const token = tokenOf(event);
		if (token) show(token);
	}

	function onOut(event: PointerEvent) {
		if (event.pointerType !== 'mouse' || !open) return;
		const into = event.relatedTarget;
		if (into instanceof Node && open.contains(into)) return;
		// The popup sits a few pixels from its token; the delay lets the pointer cross that gap.
		closeTimer = window.setTimeout(hide, CLOSE_DELAY_MS);
	}

	function onDown(event: PointerEvent) {
		if (event.pointerType === 'mouse') return;
		const token = tokenOf(event);
		if (!token) return hide();
		// A tap inside an open popup is the reader selecting its text, not a request to close it.
		if (event.target instanceof Element && event.target.closest(POPUP)) return;
		if (open === token) hide();
		else show(token);
	}

	function onKey(event: KeyboardEvent) {
		if (event.key === 'Escape') hide();
	}

	function onScroll() {
		if (open) place(open);
	}

	onMount(() => {
		document.addEventListener('pointerover', onOver);
		document.addEventListener('pointerout', onOut);
		document.addEventListener('pointerdown', onDown);
		document.addEventListener('keydown', onKey);
		document.addEventListener('scroll', onScroll, { capture: true, passive: true });
		return () => {
			hide();
			document.removeEventListener('pointerover', onOver);
			document.removeEventListener('pointerout', onOut);
			document.removeEventListener('pointerdown', onDown);
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('scroll', onScroll, { capture: true });
		};
	});
</script>
