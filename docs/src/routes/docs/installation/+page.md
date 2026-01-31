---
title: Installation
description: How to install @appulsauce/svelte-grid
---

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

Once installed, head to the [Quick Start](../quickstart) guide to create your first grid.
