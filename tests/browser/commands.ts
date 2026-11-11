/**
 * Browser commands for the unit tests when they run in a real browser (Vitest browser mode
 * with the Playwright provider). They run in Node, next to Playwright, and drive real input:
 * the browser does its own hit-testing, pointer capture and event ordering, which synthetic
 * events dispatched from the page skip.
 */
// Re-exported so this module pulls in the provider's types for the command context (page, frame).
export type { PlaywrightProviderOptions } from '@vitest/browser-playwright';
import type { CDPSession } from '@playwright/test';
import type { BrowserCommand } from 'vitest/node';

/** One step of real mouse input, in the test iframe's client coordinates. */
export type MouseStep = { type: 'move' | 'down' | 'up'; x: number; y: number };

/**
 * Plays `steps` with Playwright's mouse. The tests run inside an iframe that Vitest scales to
 * fit the browser window, so a client coordinate maps to the page as
 * $\text{page} = \text{origin} + \text{client} \cdot \frac{\text{drawn width}}{\text{inner width}}$.
 */
export const mouse: BrowserCommand<[steps: MouseStep[]]> = async (ctx, steps) => {
	const frame = await ctx.frame();
	const element = await frame.frameElement();
	const box = await element.boundingBox();
	if (!box) throw new Error('the test iframe has no layout box');
	const innerWidth = await frame.evaluate(() => window.innerWidth);
	const scale = box.width / innerWidth;
	for (const step of steps) {
		const x = box.x + step.x * scale;
		const y = box.y + step.y * scale;
		// steps: 1 sends a single pointermove per move, as a fast real pointer would.
		if (step.type === 'move') await ctx.page.mouse.move(x, y, { steps: 1 });
		else {
			await ctx.page.mouse.move(x, y, { steps: 1 });
			await (step.type === 'down' ? ctx.page.mouse.down() : ctx.page.mouse.up());
		}
	}
};

/**
 * One step of real touch input: a finger goes down, moves or lifts, in the test iframe's client
 * coordinates; `wait` holds every finger still for `ms`. `finger` tells several fingers apart.
 */
export type TouchStep =
	{ type: 'down' | 'move' | 'up'; x: number; y: number; finger?: number } | { type: 'wait'; ms: number };

const TOUCH_EVENT = { down: 'touchStart', move: 'touchMove', up: 'touchEnd' } as const;

/**
 * One protocol session per page, kept across calls with the fingers still down, so a test can
 * press in one call, wait in the page for the drag to start, and move in the next.
 */
const touchSessions = new WeakMap<
	object,
	{ session: CDPSession; down: Map<number, { x: number; y: number; id: number }> }
>();

/**
 * Plays `steps` as touch input through the DevTools protocol (Chromium only: Playwright has no
 * touch moves, and Firefox no protocol for them). The input goes through Chromium's own gesture
 * handling, so a swipe really scrolls, touch-action applies and pointercancel fires as it would
 * under a finger. Each event lists every finger still down, as the protocol expects.
 */
export const touch: BrowserCommand<[steps: TouchStep[]]> = async (ctx, steps) => {
	if (ctx.page.context().browser()?.browserType().name() !== 'chromium') {
		throw new Error('touch input needs Chromium');
	}
	const frame = await ctx.frame();
	const element = await frame.frameElement();
	const box = await element.boundingBox();
	if (!box) throw new Error('the test iframe has no layout box');
	const innerWidth = await frame.evaluate(() => window.innerWidth);
	const scale = box.width / innerWidth;
	let state = touchSessions.get(ctx.page);
	if (!state) {
		state = { session: await ctx.page.context().newCDPSession(ctx.page), down: new Map() };
		touchSessions.set(ctx.page, state);
	}
	const { session, down } = state;
	for (const step of steps) {
		if (step.type === 'wait') {
			await new Promise((resolve) => setTimeout(resolve, step.ms));
			continue;
		}
		const id = step.finger ?? 0;
		const point = { x: box.x + step.x * scale, y: box.y + step.y * scale, id };
		if (step.type === 'up') down.delete(id);
		else down.set(id, point);
		await session.send('Input.dispatchTouchEvent', {
			type: TOUCH_EVENT[step.type],
			touchPoints: [...down.values()]
		});
	}
};

declare module 'vitest/browser' {
	interface BrowserCommands {
		mouse: (steps: MouseStep[]) => Promise<void>;
		touch: (steps: TouchStep[]) => Promise<void>;
	}
}
