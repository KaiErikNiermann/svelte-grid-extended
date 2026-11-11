import { resolve } from '$app/paths';
import type { RouteId } from '$app/types';

/**
 * `resolve()` for a route held in a variable. `resolve` types its argument by expanding the
 * `RouteId` union into one tuple per route, and TypeScript stops expanding a union past 25
 * members, so a union-typed argument fails to type-check once the site has more routes than
 * that. No route here takes params, so every route resolves with the route alone.
 */
export const routeHref = resolve as (route: RouteId) => string;
