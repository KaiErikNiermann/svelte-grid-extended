/**
 * Browser commands for the unit tests when they run in a real browser (Vitest browser mode
 * with the Playwright provider). They run in Node, next to Playwright, and drive real input:
 * the browser does its own hit-testing, pointer capture and event ordering, which synthetic
 * events dispatched from the page skip.
 */
// Re-exported so this module pulls in the provider's types for the command context (page, frame).
export type { PlaywrightProviderOptions } from '@vitest/browser-playwright';
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

declare module 'vitest/browser' {
	interface BrowserCommands {
		mouse: (steps: MouseStep[]) => Promise<void>;
	}
}
