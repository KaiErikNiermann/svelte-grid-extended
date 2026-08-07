---
title: Installation
description: How to install @appulsauce/svelte-grid
---

<script>
	import { resolve } from '$app/paths';

	// mdsvex smartypants rewrites straight quotes inside inline HTML, so resolve() is
	// called here rather than inline in the prose below.
	const quickstartPath = resolve('/docs/quickstart');
</script>

# Installation

Install the package using your preferred package manager:

```bash
# npm
npm install @appulsauce/svelte-grid

# pnpm
pnpm add @appulsauce/svelte-grid

# yarn
yarn add @appulsauce/svelte-grid
```

## Requirements

- **Svelte 5.0.0** or higher
- A module bundler (Vite, SvelteKit, etc.)

## TypeScript Support

The package includes TypeScript declarations out of the box. No additional `@types` packages are needed.

## Importing

Import the components and types from the package:

```typescript
// Components
import Grid, { GridItem } from '@appulsauce/svelte-grid';

// Types
import type { GridController, LayoutChangeDetail, LayoutItem } from '@appulsauce/svelte-grid';
```

## Next Steps

Once installed, head to the <a href={quickstartPath}>Quick Start</a> guide to create your first grid.
