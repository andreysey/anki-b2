import { cva, type VariantProps } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/30',
        secondary:
          'border-transparent bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        destructive:
          'border-transparent bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
        success:
          'border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
        outline: 'text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export type BadgeVariants = VariantProps<typeof badgeVariants>;
