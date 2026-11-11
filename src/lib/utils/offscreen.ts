/**
 * How far outside the viewport a grid may be before its rendering is skipped: one viewport
 * height above and below, so a grid is rendered again well before it scrolls into view.
 */
export const OFFSCREEN_MARGIN = '100% 0px';

export type OffscreenState = { offscreen: boolean; width: number; height: number };

/**
 * Reports whether `element` is far from the viewport, with its last measured size.
 * Returns a cleanup function. Without IntersectionObserver (old browsers, jsdom) it never
 * reports, so the element always renders normally.
 */
export function watchOffscreen(element: Element, onChange: (state: OffscreenState) => void): () => void {
	if (typeof IntersectionObserver === 'undefined') return () => {};
	const observer = new IntersectionObserver(
		(entries) => {
			const entry = entries.at(-1);
			if (!entry) return;
			const { width, height } = entry.boundingClientRect;
			onChange({ offscreen: !entry.isIntersecting, width, height });
		},
		{ rootMargin: OFFSCREEN_MARGIN }
	);
	observer.observe(element);
	return () => observer.disconnect();
}

/**
 * Styles for a grid that is far off screen: `content-visibility: auto` lets the browser skip
 * its paint and hit-testing (the cost of thousands of positioned items, resize handles and
 * `touch-action` regions while scrolling), while it stays in the accessibility tree and
 * find-in-page. It is applied only off screen because it also brings paint containment,
 * which on screen would clip items dragged or overflowing outside the grid and capture
 * `position: fixed` content. The intrinsic size keeps the page height stable.
 */
export function offscreenCss(state: OffscreenState | undefined): string {
	if (!state?.offscreen || state.width <= 0 || state.height <= 0) return '';
	return `content-visibility: auto; contain-intrinsic-size: auto ${state.width}px auto ${state.height}px;`;
}
