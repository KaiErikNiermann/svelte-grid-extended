/**
 * Touch input: a finger has to be held on an item for the grid's `touchDelay` before a drag
 * starts, so a swipe across a grid still scrolls the page; a gesture follows only the finger
 * that started it, and a grid runs one gesture at a time.
 *
 * jsdom gets synthetic touch pointer events and fake timers. Chromium gets real touch input
 * through the DevTools protocol, so its gesture handling decides what scrolls and when a pointer
 * is cancelled. Firefox has no way to send touch moves from Playwright, so it skips the suite.
 */
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { FIXED_SIZE, IN_JSDOM, item, mountLayout, useLayoutHarness, type MountedLayout } from './layout-harness';

useLayoutHarness();

const DELAY = 300;
/** Long enough that a test's quick moves always come before the press would have started a drag. */
const NEVER = 60_000;
const IN_CHROMIUM = !IN_JSDOM && navigator.userAgent.includes('Chrome');

beforeEach(() => {
	if (IN_JSDOM) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
});

afterEach(() => {
	vi.useRealTimers();
	if (!IN_JSDOM) window.scrollTo(0, 0);
});

/** A synthetic touch pointer event; jsdom has no PointerEvent, so the fields are added by hand. */
function syntheticTouch(target: EventTarget, type: string, x: number, y: number, finger: number) {
	const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX: x, clientY: y });
	Object.defineProperties(event, { pointerType: { value: 'touch' }, pointerId: { value: 10 + finger } });
	target.dispatchEvent(event);
}

type Finger = {
	/** Moves to `dx`, `dy` cells from where the finger went down. */
	move: (dx: number, dy: number) => Promise<void>;
	up: () => Promise<void>;
	/** Holds the finger still until the press has started the item's gesture. */
	hold: () => Promise<void>;
};

async function waitFor(condition: () => boolean, what: string, timeoutMs = 3000): Promise<void> {
	const deadline = performance.now() + timeoutMs;
	while (!condition()) {
		if (performance.now() > deadline) throw new Error(`timed out waiting for ${what}`);
		await new Promise((resolve) => requestAnimationFrame(resolve));
	}
}

/** Puts a finger down on the centre of `selector`, inside the grid. */
async function fingerOn(grid: MountedLayout, selector: string, finger = 0): Promise<Finger> {
	const target = grid.container.querySelector(selector);
	if (!target) throw new Error(`nothing matches ${selector}`);
	const box = target.getBoundingClientRect();
	const start = IN_JSDOM ? { x: 0, y: 0 } : { x: box.left + box.width / 2, y: box.top + box.height / 2 };
	let at = start;
	const send = async (type: 'down' | 'move' | 'up') => {
		if (IN_JSDOM) syntheticTouch(type === 'down' ? target : window, `pointer${type}`, at.x, at.y, finger);
		else {
			const { commands } = await import('vitest/browser');
			await commands.touch([{ type, ...at, finger }]);
		}
		await grid.settle();
	};
	await send('down');
	const owner = target.closest('.it');
	return {
		move: async (dx, dy) => {
			at = { x: start.x + dx * grid.pitch, y: start.y + dy * grid.pitch };
			await send('move');
		},
		up: () => send('up'),
		hold: async () => {
			if (IN_JSDOM) vi.advanceTimersByTime(DELAY);
			else await waitFor(() => !!owner?.classList.contains('active-default'), `${selector} to start its gesture`);
			await grid.settle();
		}
	};
}

const active = (grid: MountedLayout, id: string) =>
	!!grid.container.querySelector(`.it-${id}`)?.classList.contains('active-default');

describe.skipIf(!IN_JSDOM && !IN_CHROMIUM)('touch input', () => {
	test('a finger held still for the touch delay drags the item', async () => {
		const grid = mountLayout({ grid: { cols: 4, touchDelay: DELAY, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const finger = await fingerOn(grid, '.it-a');
		await finger.hold();
		expect(active(grid, 'a')).toBe(true);
		await finger.move(1, 1);
		await finger.up();

		expect(grid.drawn().a).toEqual({ x: 1, y: 1, w: 1, h: 1 });
	});

	// Only jsdom's clock is controlled: in a browser "before the delay" is a wall-clock race.
	test.skipIf(!IN_JSDOM)('the drag does not start before the delay has passed', async () => {
		const grid = mountLayout({ grid: { cols: 4, touchDelay: DELAY, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const finger = await fingerOn(grid, '.it-a');
		vi.advanceTimersByTime(DELAY - 1);
		await grid.settle();
		expect(active(grid, 'a')).toBe(false);
		vi.advanceTimersByTime(1);
		await grid.settle();
		expect(active(grid, 'a')).toBe(true);
		await finger.up();
	});

	test('a swipe across an item does not drag it, and in a browser it scrolls the page', async () => {
		const items = Array.from({ length: 30 }, (_, i) => item(`r${i}`, 0, i));
		const grid = mountLayout({ grid: { cols: 2, touchDelay: NEVER, ...FIXED_SIZE }, items });
		await grid.settle();
		const before = grid.drawn();
		const finger = await fingerOn(grid, '.it-r3');
		for (let step = 1; step <= 6; step++) await finger.move(0, -step / 2);
		await finger.up();
		if (IN_JSDOM) vi.advanceTimersByTime(NEVER);
		await grid.settle();

		expect(grid.drawn()).toEqual(before);
		expect(active(grid, 'r3')).toBe(false);
		if (!IN_JSDOM) expect(window.scrollY).toBeGreaterThan(0);
	});

	// Where the page cannot scroll that way, the browser cancels nothing, so the grid itself has
	// to tell the swipe apart. jsdom only: in a browser the moves racing the delay is wall-clock.
	test.skipIf(!IN_JSDOM)('a finger that moved off before the delay does not drag when it then holds', async () => {
		const grid = mountLayout({ grid: { cols: 4, touchDelay: DELAY, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const finger = await fingerOn(grid, '.it-a');
		await finger.move(0.2, 0);
		vi.advanceTimersByTime(DELAY);
		await grid.settle();
		expect(active(grid, 'a')).toBe(false);
		await finger.move(2, 0);
		await finger.up();

		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 1, h: 1 });
	});

	test('a tap does nothing, and the grid takes the next drag', async () => {
		const grid = mountLayout({
			grid: { cols: 4, touchDelay: DELAY, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 2, 0)]
		});
		await grid.settle();
		const finger = await fingerOn(grid, '.it-a');
		await finger.up();
		if (IN_JSDOM) vi.advanceTimersByTime(DELAY);
		else await new Promise((resolve) => setTimeout(resolve, DELAY + 100));
		await grid.settle();
		expect(active(grid, 'a')).toBe(false);

		const next = await fingerOn(grid, '.it-b');
		await next.hold();
		await next.move(1, 0);
		await next.up();
		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 1, h: 1 });
		expect(grid.drawn().b).toEqual({ x: 3, y: 0, w: 1, h: 1 });
	});

	test('a second finger neither moves the dragged item nor drags another one', async () => {
		const grid = mountLayout({
			grid: { cols: 6, touchDelay: DELAY, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 3, 0)]
		});
		await grid.settle();
		const first = await fingerOn(grid, '.it-a', 0);
		await first.hold();
		const second = await fingerOn(grid, '.it-b', 1);
		if (IN_JSDOM) vi.advanceTimersByTime(DELAY);
		else await new Promise((resolve) => setTimeout(resolve, DELAY + 100));
		await second.move(0, 2);
		await first.move(1, 1);
		await second.move(1, 3);
		await second.up();
		await first.up();

		expect(grid.drawn().a).toEqual({ x: 1, y: 1, w: 1, h: 1 });
		expect(grid.drawn().b).toEqual({ x: 3, y: 0, w: 1, h: 1 });
	});

	test('with touchDelay 0 a finger drags at once', async () => {
		const grid = mountLayout({ grid: { cols: 4, touchDelay: 0, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const finger = await fingerOn(grid, '.it-a');
		await finger.move(2, 0);
		await finger.up();

		expect(grid.drawn().a).toEqual({ x: 2, y: 0, w: 1, h: 1 });
	});

	// jsdom does not compute touch-action from the component's stylesheet.
	test.skipIf(IN_JSDOM)('the resize handle, which cannot scroll, resizes at once', async () => {
		const grid = mountLayout({ grid: { cols: 4, touchDelay: NEVER, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		const finger = await fingerOn(grid, '.it-a .resizer-default');
		await finger.move(1, 1);
		await finger.up();

		expect(grid.drawn().a).toEqual({ x: 0, y: 0, w: 2, h: 2 });
	});

	test('an item removed while it is pressed starts nothing, and the grid takes the next drag', async () => {
		const grid = mountLayout({
			grid: { cols: 4, touchDelay: DELAY, ...FIXED_SIZE },
			items: [item('a', 0, 0), item('b', 2, 0)]
		});
		await grid.settle();
		const finger = await fingerOn(grid, '.it-a');
		grid.component.remove('a');
		await grid.settle();
		if (IN_JSDOM) vi.advanceTimersByTime(DELAY);
		await finger.up();

		await grid.drag('b', 1, 0);
		expect(grid.drawn().b).toEqual({ x: 3, y: 0, w: 1, h: 1 });
	});
});

const touchAction = (grid: MountedLayout, id: string) =>
	grid.container.querySelector<HTMLElement>(`.it-${id}`)!.style.touchAction;

// jsdom's style object drops touch-action, and so does the attribute it writes back.
describe.skipIf(IN_JSDOM)('touch-action on items', () => {
	test('a draggable item lets a finger scroll the page until a drag starts', async () => {
		const grid = mountLayout({ grid: { cols: 4, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		expect(touchAction(grid, 'a')).toBe('manipulation');
	});

	test('with touchDelay 0 a draggable item takes every touch', async () => {
		const grid = mountLayout({ grid: { cols: 4, touchDelay: 0, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		expect(touchAction(grid, 'a')).toBe('none');
	});

	test('an item that cannot be dragged leaves touch to the page', async () => {
		const grid = mountLayout({ grid: { cols: 4, readOnly: true, ...FIXED_SIZE }, items: [item('a', 0, 0)] });
		await grid.settle();
		expect(touchAction(grid, 'a')).toBe('');
	});
});
