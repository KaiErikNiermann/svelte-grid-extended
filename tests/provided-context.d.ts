// Values vitest.config.ts provides to every test environment, read with inject().
import 'vitest';

declare module 'vitest' {
	export interface ProvidedContext {
		/** fast-check runs per property-test config (LAYOUT_PROPERTY_RUNS, default 60). */
		layoutPropertyRuns: number;
		/** Longest operation sequence per run (LAYOUT_PROPERTY_MAX_OPS, default 12). */
		layoutPropertyMaxOps: number;
	}
}
