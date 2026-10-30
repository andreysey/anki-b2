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
npx shadcn-vue@2.9.0 add <component-name>

# Add multiple components
npx shadcn-vue@2.9.0 add tooltip tabs dropdown-menu

# Overwrite existing component
npx shadcn-vue@2.9.0 add button --overwrite
```

## Project Structure & Conventions

- **UI Primitives**: Located in `@/components/ui/` (e.g. `@/components/ui/button/Button.vue`, `@/components/ui/dialog/Dialog.vue`).
- **Utility Function**: `cn()` helper in `@/lib/utils.ts` combining `clsx` and `tailwind-merge`.
- **Configuration**: Managed by `components.json` at root.
- **Component Variants**: Defined using `class-variance-authority` (`cva`) in `index.ts` alongside components.

## Colors & Theming (project convention)

App components use the Tailwind **slate** palette with explicit `dark:` variants and the brand
`primary-*` scale — not the shadcn semantic tokens. Follow what neighbouring components do:

- Surfaces: `bg-white/95 dark:bg-slate-900/90`, borders `border-slate-200/90 dark:border-white/10`
- Text: `text-slate-900 dark:text-white`, secondary `text-slate-600 dark:text-slate-400`
  (avoid `text-slate-500` on light grey backgrounds — it fails WCAG AA)
- Accent: `text-primary-600 dark:text-primary-400`, `bg-primary-500/10`

The semantic tokens (`bg-card`, `text-muted-foreground`, …) exist in `src/assets/main.css` only for
the generated shadcn primitives in `src/components/ui/`. Don't introduce them in app components.

Icons come from **`@lucide/vue`** (not `lucide-vue-next`).

## Component Example

```vue
<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Sparkles } from '@lucide/vue';
</script>

<template>
  <div
    class="flex items-center gap-3 p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10"
  >
    <span class="text-sm text-slate-600 dark:text-slate-400">New</span>
    <Button variant="default" size="sm">
      <Sparkles class="h-4 w-4 mr-1.5" aria-hidden="true" />
      Get Started
    </Button>
  </div>
</template>
```

After UI changes run `npm run build && npm run audit:ui` (screenshots, contrast, axe-core).

## References

- Official Documentation: https://shadcn-vue.com/docs
- Components List: https://shadcn-vue.com/docs/components
- Theming Guide: https://shadcn-vue.com/docs/theming
- CLI Reference: https://shadcn-vue.com/docs/cli
