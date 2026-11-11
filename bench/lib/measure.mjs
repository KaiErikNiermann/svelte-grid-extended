/**
 * One benchmark run in Chromium: load the bench page for a scenario, then scroll it or drag
 * an item, and return the metrics named in stats.mjs.
 */
import { percentile } from './stats.mjs';

/** A frame longer than this is visibly slow (1.5 frames at 60 Hz). */
const SLOW_FRAME_MS = 25;

/** Records main-thread frame intervals with requestAnimationFrame until stopped. */
async function startFrameRecorder(page) {
	await page.evaluate(() => {
		window.__frames = [];
		window.__stopFrames = false;
		let last = performance.now();
		const loop = (t) => {
			window.__frames.push(t - last);
			last = t;
			if (!window.__stopFrames) requestAnimationFrame(loop);
		};
		requestAnimationFrame(loop);
	});
}

async function stopFrameRecorder(page) {
	const frames = await page.evaluate(() => {
		window.__stopFrames = true;
		return window.__frames.slice(1);
	});
	return {
		slowFrames: frames.filter((f) => f > SLOW_FRAME_MS).length,
		frameP95Ms: percentile(frames, 0.95)
	};
}

/** Loads the page and waits until every item is in the DOM with a position. */
async function load(page, cdp, url, expected) {
	await page.goto(url, { waitUntil: 'load', timeout: 180_000 });
	const ready = await page.waitForFunction(
		(n) => {
			const items = document.querySelectorAll('.bench-item');
			const placed = items.length === n && [...items].every((el) => el.style.width && !el.style.width.startsWith('0'));
			return placed && performance.now();
		},
		expected,
		{ polling: 'raf', timeout: 180_000 }
	);
	const readyMs = await ready.jsonValue();
	await page.waitForTimeout(300);
	await cdp.send('HeapProfiler.collectGarbage');
	const { metrics } = await cdp.send('Performance.getMetrics');
	const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
	return { readyMs, scriptMs: m.ScriptDuration * 1000, heapMiB: m.JSHeapUsedSize / 2 ** 20 };
}

/** Wheels from the top of the page to the bottom, 300 px per event, one event per frame. */
async function scroll(page) {
	await page.mouse.move(640, 400);
	await startFrameRecorder(page);
	const bottom = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
	for (let i = 0; i < 3000 && (await page.evaluate(() => scrollY)) < bottom - 2; i++) {
		await page.mouse.wheel(0, 300);
		await page.waitForTimeout(16);
	}
	await page.waitForTimeout(300);
	return stopFrameRecorder(page);
}

/** Drags the first item 6 columns right and 12 rows down in 48 pointer moves. */
async function drag(page) {
	const box = await page.locator('.bench-item').first().boundingBox();
	if (!box) throw new Error('no item to drag');
	const start = { x: box.x + 10, y: box.y + 10 };
	await page.mouse.move(start.x, start.y);
	await startFrameRecorder(page);
	const t0 = await page.evaluate(() => performance.now());
	await page.mouse.down();
	for (let step = 1; step <= 48; step++) {
		await page.mouse.move(start.x + step * 8, start.y + step * 8.5);
		await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
	}
	await page.mouse.up();
	const dragMs = (await page.evaluate(() => performance.now())) - t0;
	return { dragMs, ...(await stopFrameRecorder(page)) };
}

/**
 * Runs one scenario once in a fresh browser context.
 * @param {import('@playwright/test').Browser} browser
 * @param {{ page: Record<string, string | number>, measure: string[], cpuThrottle?: number }} scenario
 * @param {string} baseUrl
 */
export async function runScenario(browser, scenario, baseUrl) {
	const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
	try {
		const page = await context.newPage();
		const errors = [];
		page.on('pageerror', (e) => errors.push(e.message));
		const cdp = await context.newCDPSession(page);
		await cdp.send('Performance.enable');
		if (scenario.cpuThrottle) await cdp.send('Emulation.setCPUThrottlingRate', { rate: scenario.cpuThrottle });
		const query = new URLSearchParams(Object.entries(scenario.page).map(([k, v]) => [k, String(v)]));
		const expected = Number(scenario.page.grids) * Number(scenario.page.items);
		const result = await load(page, cdp, `${baseUrl}/bench?${query}`, expected);
		if (scenario.measure.includes('scroll')) Object.assign(result, await scroll(page));
		if (scenario.measure.includes('drag')) Object.assign(result, await drag(page));
		if (errors.length > 0) throw new Error(`page errors: ${errors.join(' | ')}`);
		return result;
	} finally {
		await context.close();
	}
}
