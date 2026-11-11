import type { RouteId } from '$app/types';

export interface NavItem {
	href: RouteId;
	label: string;
}

export interface NavSection {
	title: string;
	items: NavItem[];
}

/** Every docs page and example, in sidebar order. The sidebar and the search palette both read it. */
export const navSections: readonly NavSection[] = [
	{
		title: 'Getting Started',
		items: [
			{ href: '/docs', label: 'Introduction' },
			{ href: '/docs/installation', label: 'Installation' },
			{ href: '/docs/quickstart', label: 'Quick Start' }
		]
	},
	{
		title: 'Core Concepts',
		items: [
			{ href: '/docs/grid', label: 'Grid Component' },
			{ href: '/docs/grid-item', label: 'GridItem Component' },
			{ href: '/docs/controller', label: 'Grid Controller' }
		]
	},
	{
		title: 'Features',
		items: [
			{ href: '/docs/static-grid', label: 'Static Grid' },
			{ href: '/docs/collision', label: 'Collision Behavior' },
			{ href: '/docs/styling', label: 'Styling' },
			{ href: '/docs/events', label: 'Events' },
			{ href: '/docs/customization', label: 'Customization' }
		]
	},
	{
		title: 'Examples',
		items: [
			{ href: '/examples', label: 'Overview' },
			{ href: '/examples/basic', label: 'Basic' },
			{ href: '/examples/static-grid', label: 'Static Grid' },
			{ href: '/examples/without-bounds', label: 'Without Bounds' },
			{ href: '/examples/styling', label: 'Styling' },
			{ href: '/examples/customization', label: 'Customization' },
			{ href: '/examples/readonly', label: 'Read Only' },
			{ href: '/examples/binding', label: 'Two Way Binding' },
			{ href: '/examples/events', label: 'Events' },
			{ href: '/examples/collision-push', label: 'Collision Push' },
			{ href: '/examples/collision-compress', label: 'Collision Compress' },
			{ href: '/examples/collision-shift', label: 'Collision Shift' },
			{ href: '/examples/placement', label: 'Placement Scenarios' },
			{ href: '/examples/text-alignment', label: 'Text Alignment' },
			{ href: '/examples/add-remove-item', label: 'Add/Remove Items' }
		]
	}
];

/** `/src/routes/docs/grid/+page.md` is the route `/docs/grid`. */
const routeOf = (file: string): string =>
	file.slice('/src/routes'.length, file.lastIndexOf('/+page'));

/**
 * Throws when a docs or example page has no entry above, or an entry has no page, so a new page
 * cannot be left out of the sidebar and the search. Runs at build time, as the site is prerendered.
 */
function assertNavCoversPages(): void {
	const pages = new Set(
		Object.keys(import.meta.glob('/src/routes/{docs,examples}/**/+page.{svelte,md}')).map((file) =>
			routeOf(file)
		)
	);
	const listed = new Set<string>(
		navSections.flatMap((section) => section.items.map((i) => i.href))
	);
	const missing = [...pages].filter((page) => !listed.has(page));
	const dangling = [...listed].filter((href) => !pages.has(href));
	if (missing.length > 0 || dangling.length > 0) {
		throw new Error(
			`nav.ts is out of step with src/routes: no entry for [${missing}], no page for [${dangling}]`
		);
	}
}

assertNavCoversPages();
