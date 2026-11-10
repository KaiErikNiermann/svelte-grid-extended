/**
 * Summary statistics for repeated benchmark runs, and the rule that decides whether a run
 * is inside the baseline's normal variation or a regression.
 */

/**
 * The metrics every scenario can report. All are "lower is better". `floor` is the smallest
 * slack a metric gets, so a metric that barely varies in calibration (0 slow frames every
 * run) still tolerates the noise a different day brings.
 */
export const METRICS = {
	readyMs: { label: 'load until every item is placed', unit: 'ms', floor: 25 },
	scriptMs: { label: 'script time during load', unit: 'ms', floor: 25 },
	heapMiB: { label: 'JS heap after load and GC', unit: 'MiB', floor: 2 },
	slowFrames: { label: 'frames over 25 ms', unit: 'frames', floor: 3 },
	frameP95Ms: { label: '95th percentile frame time', unit: 'ms', floor: 5 },
	dragMs: { label: 'time to perform the drag', unit: 'ms', floor: 30 }
};

/** Relative slack: a run within 10% of the baseline median is never a regression. */
export const RELATIVE_SLACK = 0.1;
/** How many MADs above the baseline median still count as noise. */
export const MAD_MULTIPLIER = 4;

/** @param {number[]} values */
export function median(values) {
	const sorted = [...values].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Median absolute deviation: $\operatorname{MAD} = \operatorname{median}_i |x_i - \tilde{x}|$. */
export function mad(values) {
	const m = median(values);
	return median(values.map((v) => Math.abs(v - m)));
}

/** @param {number[]} values @param {number} p */
export function percentile(values, p) {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0;
}

/**
 * The baseline entry for one metric. Slack is the allowed rise above the median:
 * $\text{slack} = \max(4 \cdot \operatorname{MAD},\ 0.1 \cdot \tilde{x},\ \text{floor})$.
 * @param {string} metric @param {number[]} values
 */
export function summarize(metric, values) {
	const m = median(values);
	const spread = mad(values);
	const slack = Math.max(MAD_MULTIPLIER * spread, RELATIVE_SLACK * m, METRICS[metric]?.floor ?? 0);
	return {
		median: round(m),
		mad: round(spread),
		min: round(Math.min(...values)),
		max: round(Math.max(...values)),
		slack: round(slack),
		runs: values.length
	};
}

/**
 * Compares one metric's current runs with its baseline entry.
 * @param {{ median: number, slack: number }} base @param {number[]} values
 * @returns {{ current: number, limit: number, verdict: 'ok' | 'regression' | 'improved' }}
 */
export function judge(base, values) {
	const current = median(values);
	const limit = base.median + base.slack;
	let verdict = 'ok';
	if (current > limit) verdict = 'regression';
	else if (current < base.median - base.slack) verdict = 'improved';
	return { current: round(current), limit: round(limit), verdict };
}

function round(v) {
	return Math.round(v * 10) / 10;
}
