---
name: shadcn-vue
description: Use and add shadcn-vue UI components in Vue 3 and Vite projects. Use when creating UI components, adding shadcn-vue components via CLI, customizing Reka UI primitives, or configuring design tokens with Tailwind CSS.
---

# shadcn-vue Component System

Comprehensive guide for developing, customizing, and adding UI components using **shadcn-vue** (powered by **Reka UI** and **Tailwind CSS v4**).

## Overview

shadcn-vue is a collection of re-usable components that you copy and paste into your apps. It is NOT a component library distributed as an npm dependency, but rather a set of accessible primitives built on top of Reka UI and styled with Tailwind CSS.

## Adding Components via CLI

Use the official CLI to install and scaffold new components directly into `src/components/ui/`:

```bash
# Add a specific component
npx shadcn-vue@latest add <component-name>

# Add multiple components
npx shadcn-vue@latest add tooltip tabs dropdown-menu

# Overwrite existing component
npx shadcn-vue@latest add button --overwrite
```

## Project Structure & Conventions

- **UI Primitives**: Located in `@/components/ui/` (e.g. `@/components/ui/button/Button.vue`, `@/components/ui/dialog/Dialog.vue`).
- **Utility Function**: `cn()` helper in `@/lib/utils.ts` combining `clsx` and `tailwind-merge`.
- **Configuration**: Managed by `components.json` at root.
- **Component Variants**: Defined using `class-variance-authority` (`cva`) in `index.ts` alongside components.

## Theming & Design Tokens

Use semantic color tokens defined in CSS variables (`src/assets/main.css`):
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-popover` / `text-popover-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`
- `bg-destructive` / `text-destructive-foreground`
- `border-border`, `ring-ring`, `bg-input`

## Component Example

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-vue-next';
</script>

<template>
  <div class="flex items-center gap-3 p-4 rounded-xl bg-card text-card-foreground border border-border">
    <Badge variant="secondary">New</Badge>
    <Button variant="default" size="sm">
      <Sparkles class="h-4 w-4 mr-1.5" />
      Get Started
    </Button>
  </div>
</template>
```

## References

- Official Documentation: https://shadcn-vue.com/docs
- Components List: https://shadcn-vue.com/docs/components
- Theming Guide: https://shadcn-vue.com/docs/theming
- CLI Reference: https://shadcn-vue.com/docs/cli
