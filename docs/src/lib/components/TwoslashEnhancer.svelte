<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { computePosition, flip, offset, shift } from '@floating-ui/dom';

	// The popups are rendered at build time inside the code, so the code block's own
	// `overflow-x: auto` would clip them. They are `position: fixed` and placed here instead, which
	// also keeps them on screen on a narrow viewport. A mouse opens them by hovering, a finger or
	// pen by tapping, and Escape or a tap elsewhere closes them. From the keyboard each code block
	// is one tab stop: Tab focuses its first token with a popup, the arrow keys (and Home/End)
	// move between tokens, focus opens the popup and Escape closes it.
	const HOVER = '.twoslash-hover';
	const POPUP = '.twoslash-popup-container';
	const CLOSE_DELAY_MS = 120;
	const OFFSET_PX = 6;
	const EDGE_PX = 8;

	let open: HTMLElement | null = null;
	let closeTimer = 0;
	let popupCount = 0;

	/** Each code block's tokens in reading order, with only the first in the tab order. */
	function makeFocusable() {
		for (const block of document.querySelectorAll('pre.twoslash')) {
			const tokens = [...block.querySelectorAll<HTMLElement>(HOVER)];
			for (const [index, token] of tokens.entries()) {
				if (token.hasAttribute('tabindex')) continue;
				token.tabIndex = index === 0 ? 0 : -1;
				const popup = popupOf(token);
				if (!popup) continue;
				popup.id ||= `twoslash-popup-${++popupCount}`;
				popup.setAttribute('role', 'tooltip');
				token.setAttribute('aria-describedby', popup.id);
			}
		}
	}

	/** Moves focus within one code block, keeping it the block's only tab stop. */
	function moveFocus(from: HTMLElement, key: string): boolean {
		const block = from.closest('pre');
		if (!block) return false;
		const tokens = [...block.querySelectorAll<HTMLElement>(HOVER)];
		const at = tokens.indexOf(from);
		const target = {
			ArrowRight: tokens[at + 1],
			ArrowDown: tokens[at + 1],
			ArrowLeft: tokens[at - 1],
			ArrowUp: tokens[at - 1],
			Home: tokens[0],
			End: tokens.at(-1)
		}[key];
		if (!target) return false;
		from.tabIndex = -1;
		target.tabIndex = 0;
		target.focus();
		return true;
	}

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
		if (event.key === 'Escape') return hide();
		const token = tokenOf(event);
		if (token && moveFocus(token, event.key)) event.preventDefault();
	}

	function onFocusIn(event: FocusEvent) {
		const token = tokenOf(event);
		if (token) show(token);
	}

	function onFocusOut(event: FocusEvent) {
		const into = event.relatedTarget;
		if (open && !(into instanceof Node && open.contains(into))) hide();
	}

	// Pages are swapped without a reload, so each new page's code blocks are set up again.
	afterNavigate(makeFocusable);

	function onScroll() {
		if (open) place(open);
	}

	onMount(() => {
		document.addEventListener('pointerover', onOver);
		document.addEventListener('pointerout', onOut);
		document.addEventListener('pointerdown', onDown);
		document.addEventListener('keydown', onKey);
		document.addEventListener('focusin', onFocusIn);
		document.addEventListener('focusout', onFocusOut);
		document.addEventListener('scroll', onScroll, { capture: true, passive: true });
		return () => {
			hide();
			document.removeEventListener('pointerover', onOver);
			document.removeEventListener('pointerout', onOut);
			document.removeEventListener('pointerdown', onDown);
			document.removeEventListener('keydown', onKey);
			document.removeEventListener('focusin', onFocusIn);
			document.removeEventListener('focusout', onFocusOut);
			document.removeEventListener('scroll', onScroll, { capture: true });
		};
	});
</script>
