#!/usr/bin/env node
/**
 * Browser benchmark for svelte-grid-extended: builds the demo app, serves the production
 * build, runs every scenario in bench/scenarios.json several times in a headless browser,
 * and compares the medians with that browser's baseline (bench/baseline.json for Chromium,
 * bench/baseline.firefox.json for Firefox).
 *
 *   node bench/run.mjs                      # 5 runs per scenario, compare with the baseline
 *   node bench/run.mjs --runs 10 --update-baseline
 *   node bench/run.mjs --only drag-large-push --runs 3
 *   node bench/run.mjs --browser firefox    # page-side metrics only; see lib/measure.mjs
 *
 * Exit status: 0 within the baseline's variation, 1 on a regression, 2 on a usage error.
 * Baselines are per machine; bench/remote.sh runs this on the exec host, where the
 * committed baseline was measured.
 */
/* eslint-disable security/detect-non-literal-fs-filename -- a local CLI: every path is built from the repository root or its own --baseline flag */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, openSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { ENGINES, runScenario, unsupported } from './lib/measure.mjs';
import { METRICS, judge, summarize } from './lib/stats.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const benchDir = path.join(root, 'bench');

const { values: opts } = parseArgs({
	options: {
		runs: { type: 'string', default: '5' },
		only: { type: 'string', multiple: true },
		'update-baseline': { type: 'boolean', default: false },
		'no-build': { type: 'boolean', default: false },
		port: { type: 'string', default: '4319' },
		browser: { type: 'string', default: 'chromium' },
		baseline: { type: 'string' },
		help: { type: 'boolean', short: 'h', default: false }
	}
});

if (opts.help) {
	console.log(await readFile(fileURLToPath(import.meta.url), 'utf8').then((s) => s.split('*/')[0]));
	process.exit(0);
}

const runs = Number(opts.runs);
if (!Number.isInteger(runs) || runs < 1) {
	console.error(`--runs must be a positive integer, got ${opts.runs}`);
	process.exit(2);
}

const engine = ENGINES[opts.browser];
if (!engine) {
	console.error(`--browser must be one of ${Object.keys(ENGINES).join(', ')}, got ${opts.browser}`);
	process.exit(2);
}
// Chromium keeps the original file name, so its baseline history stays in one place.
opts.baseline ??= path.join(benchDir, opts.browser === 'chromium' ? 'baseline.json' : `baseline.${opts.browser}.json`);

const allScenarios = JSON.parse(await readFile(path.join(benchDir, 'scenarios.json'), 'utf8'));
const scenarios = opts.only ? allScenarios.filter((s) => opts.only.includes(s.name)) : allScenarios;
if (scenarios.length === 0) {
	console.error(`no scenario matches ${opts.only?.join(', ')}; known: ${allScenarios.map((s) => s.name).join(', ')}`);
	process.exit(2);
}

function git(...args) {
	// git from PATH: there is no fixed location for it across the machines this runs on.
	// eslint-disable-next-line sonarjs/no-os-command-from-path
	return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

/** A tool from the repository's own node_modules, by absolute path. */
const bin = (name) => path.join(root, 'node_modules', '.bin', name);

function machine(browserVersion) {
	const cpus = os.cpus();
	return {
		host: os.hostname(),
		cpu: cpus[0]?.model ?? 'unknown',
		cores: cpus.length,
		node: process.version,
		browser: opts.browser,
		browserVersion
	};
}

/** The browser a baseline was measured in; baselines from before --browser are Chromium's. */
const browserOf = (env) => `${env.browser ?? 'chromium'} ${env.browserVersion ?? env.chromium}`;

function build() {
	execFileSync(bin('svelte-kit'), ['sync'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
	execFileSync(bin('vite'), ['build'], { cwd: root, stdio: ['ignore', 'ignore', 'inherit'] });
}

/**
 * Serves the production build on 127.0.0.1 (a bare `localhost` may bind only one of IPv4
 * and IPv6) and resolves once the bench page answers. The server's output goes to
 * bench/results/preview.log, so a server that never answers can be diagnosed.
 */
async function serve(port) {
	await mkdir(path.join(benchDir, 'results'), { recursive: true });
	const log = openSync(path.join(benchDir, 'results', 'preview.log'), 'w');
	const server = spawn(bin('vite'), ['preview', '--host', '127.0.0.1', '--port', port, '--strictPort'], {
		cwd: root,
		stdio: ['ignore', log, log],
		detached: true
	});
	const url = `http://127.0.0.1:${port}`;
	for (let i = 0; i < 300; i++) {
		if (server.exitCode !== null) break;
		try {
			const response = await fetch(`${url}/bench?grids=1&items=1`);
			if (response.ok) return { url, stop: () => process.kill(-server.pid) };
		} catch {
			// not listening yet
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	if (server.exitCode === null) process.kill(-server.pid);
	throw new Error(`vite preview did not answer on ${url}; see bench/results/preview.log`);
}

/** Runs every scenario `runs` times, interleaved so slow drift hits all scenarios alike. */
async function measureAll(browser, url) {
	const samples = Object.fromEntries(scenarios.map((s) => [s.name, {}]));
	for (let r = 0; r < runs; r++) {
		for (const scenario of scenarios) {
			const reason = unsupported(engine, scenario);
			if (reason) {
				if (r === 0) process.stderr.write(`skip ${scenario.name}: ${reason}\n`);
				continue;
			}
			const result = await runScenario(browser, scenario, url, engine);
			const bucket = samples[scenario.name];
			for (const [metric, value] of Object.entries(result)) {
				bucket[metric] = [...(bucket[metric] ?? []), value];
			}
			process.stderr.write(`run ${r + 1}/${runs} ${scenario.name}\n`);
		}
	}
	return samples;
}

function summarizeAll(samples) {
	// A scenario the engine skipped has no samples and stays out of the baseline.
	const measured = Object.entries(samples).filter(([, metrics]) => Object.keys(metrics).length > 0);
	return Object.fromEntries(
		measured.map(([name, metrics]) => [
			name,
			Object.fromEntries(Object.entries(metrics).map(([metric, values]) => [metric, summarize(metric, values)]))
		])
	);
}

/**
 * With --only, an updated baseline keeps the scenarios that were not run. Merging is only
 * sound for numbers from the same machine and browser, so anything else is refused.
 */
async function mergeIntoBaseline(file, env, summary) {
	if (!existsSync(file)) return summary;
	const previous = JSON.parse(await readFile(file, 'utf8'));
	if (previous.env.cpu !== env.cpu || browserOf(previous.env) !== browserOf(env)) {
		throw new Error(
			`--only --update-baseline would mix machines: the baseline is from ${previous.env.cpu} / ${browserOf(previous.env)}. Update every scenario instead.`
		);
	}
	return { ...previous.scenarios, ...summary };
}

function compare(baseline, samples) {
	const rows = [];
	for (const [name, metrics] of Object.entries(samples)) {
		for (const [metric, values] of Object.entries(metrics)) {
			const base = baseline.scenarios[name]?.[metric];
			if (!base) {
				rows.push({ name, metric, verdict: 'new', current: values });
				continue;
			}
			rows.push({ name, metric, base, ...judge(base, values) });
		}
	}
	return rows;
}

const pad = (v, n) => String(v).padStart(n);

function printComparison(rows) {
	console.log(
		`\n${'scenario'.padEnd(22)}${'metric'.padEnd(12)}${pad('baseline', 10)}${pad('slack', 8)}${pad('now', 10)}  verdict`
	);
	for (const r of rows) {
		const unit = METRICS[r.metric]?.unit ?? '';
		const slack = `±${r.base?.slack}`;
		const base = r.base ? pad(r.base.median, 10) + pad(slack, 8) : pad('-', 18);
		const now = typeof r.current === 'number' ? r.current : '-';
		const flag = r.verdict === 'regression' ? 'REGRESSION' : r.verdict;
		console.log(`${r.name.padEnd(22)}${r.metric.padEnd(12)}${base}${pad(now, 10)}  ${flag} ${unit}`);
	}
}

const build_ = !opts['no-build'];
if (build_) build();
const server = await serve(opts.port);
const browser = await engine.launcher.launch();
let exitCode = 0;
try {
	// bench/remote.sh runs on a copy without .git and passes the commit in.
	const env = {
		...machine(browser.version()),
		commit: process.env.BENCH_COMMIT ?? git('rev-parse', '--short', 'HEAD'),
		dirty: process.env.BENCH_DIRTY ? process.env.BENCH_DIRTY === '1' : git('status', '--porcelain') !== ''
	};
	const samples = await measureAll(browser, server.url);
	const summary = summarizeAll(samples);
	await mkdir(path.join(benchDir, 'results'), { recursive: true });
	const stamp = new Date().toISOString().replaceAll(':', '-').slice(0, 19);
	const resultFile = path.join(benchDir, 'results', `${stamp}-${env.commit}.json`);
	await writeFile(resultFile, JSON.stringify({ env, runs, summary, samples }, null, '\t'));
	console.log(`results: ${path.relative(root, resultFile)}`);

	if (opts['update-baseline']) {
		const scenarios = opts.only ? await mergeIntoBaseline(opts.baseline, env, summary) : summary;
		await writeFile(opts.baseline, `${JSON.stringify({ env, runs, scenarios }, null, '\t')}\n`);
		console.log(`baseline written: ${path.relative(root, opts.baseline)}`);
	} else if (existsSync(opts.baseline)) {
		const baseline = JSON.parse(await readFile(opts.baseline, 'utf8'));
		if (baseline.env.cpu !== env.cpu || browserOf(baseline.env) !== browserOf(env)) {
			console.warn(
				`warning: baseline is from ${baseline.env.cpu} / ${browserOf(baseline.env)}; this is ${env.cpu} / ${browserOf(env)}. Verdicts are only meaningful on the same machine and browser.`
			);
		}
		const rows = compare(baseline, samples);
		printComparison(rows);
		if (rows.some((r) => r.verdict === 'regression')) exitCode = 1;
	} else {
		console.warn(`no baseline at ${path.relative(root, opts.baseline)}; run with --update-baseline to create one`);
	}
} finally {
	await browser.close();
	server.stop();
}
process.exit(exitCode);
