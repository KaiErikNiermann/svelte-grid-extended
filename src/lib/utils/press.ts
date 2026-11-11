/**
 * How far, in CSS pixels, a finger may wander while it is held down before a touch drag starts.
 * A finger never holds perfectly still; moving further than this is a swipe, not a press.
 */
export const PRESS_TOLERANCE_PX = 10;

/** `touch-action` values that leave the browser free to pan from an element. */
const PANS = new Set(['', 'auto', 'manipulation']);

/**
 * Whether a touch that starts on `target` can pan the page: no element from it up to the root
 * has a `touch-action` that rules panning out (`none`, or a value with no `pan-*` in it).
 */
export function canPanFrom(target: Element | null): boolean {
	for (let el = target; el; el = el.parentElement) {
		// Engines without `touch-action` in computed style (jsdom) report undefined.
		const value = (getComputedStyle(el).touchAction as string | undefined) ?? '';
		if (!PANS.has(value) && !value.includes('pan')) return false;
	}
	return true;
}

/**
 * Whether a gesture from this pointer waits for the finger to be held still for `delay` ms
 * before it starts. A finger or pen on something the page could scroll from must be told apart
 * from a swipe; a mouse, or a touch on a handle with `touch-action: none` (the browser will not
 * scroll from there anyway), starts at once.
 */
export function waitsForPress(event: PointerEvent, delay: number): boolean {
	const touchLike = event.pointerType === 'touch' || event.pointerType === 'pen';
	return touchLike && delay > 0 && canPanFrom(event.target instanceof Element ? event.target : null);
}

/** Whether the pointer has moved further than the press tolerance from where it went down. */
export function leftPress(start: { x: number; y: number }, event: PointerEvent): boolean {
	return Math.hypot(event.clientX - start.x, event.clientY - start.y) > PRESS_TOLERANCE_PX;
}
