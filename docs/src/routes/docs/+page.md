---
title: Introduction
description: Get started with @appulsauce/svelte-grid
---

<script>
	import { ArrowRight } from 'lucide-svelte';
</script>

# Introduction

**@appulsauce/svelte-grid** is a draggable and resizable grid layout component for Svelte 5. It provides a flexible way to create dynamic, interactive grid layouts with features like collision detection, custom handles, and two-way data binding.

## Features

- **Draggable Items** - Move items around the grid with mouse or touch
- **Resizable Items** - Resize items with customizable min/max constraints
- **Collision Detection** - Multiple collision strategies (none, push, compress)
- **Two-way Binding** - Bind item positions and sizes directly to your state
- **Custom Handles** - Use custom move and resize handles via snippets
- **Grid Controller** - Programmatically control the grid layout
- **TypeScript Support** - Full TypeScript support with exported types
- **Svelte 5 Ready** - Built with Svelte 5 runes and snippets

## Requirements

- Svelte 5.0.0 or higher
- A bundler that supports ES modules (Vite, SvelteKit, etc.)

## Quick Links

<div class="grid gap-3 sm:grid-cols-2 mt-6">
	<a href="/docs/installation" class="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors">
		<h3 class="font-semibold mb-1">Installation</h3>
		<p class="text-sm text-muted-foreground">Install the package and set up your project</p>
	</a>
	<a href="/docs/quickstart" class="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors">
		<h3 class="font-semibold mb-1">Quick Start</h3>
		<p class="text-sm text-muted-foreground">Get up and running in minutes</p>
	</a>
	<a href="/docs/grid" class="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors">
		<h3 class="font-semibold mb-1">Grid Component</h3>
		<p class="text-sm text-muted-foreground">Learn about the main Grid component</p>
	</a>
	<a href="/examples" class="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-colors">
		<h3 class="font-semibold mb-1">Examples</h3>
		<p class="text-sm text-muted-foreground">See the grid in action</p>
	</a>
</div>
