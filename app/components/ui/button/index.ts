import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground backdrop-blur-md hover:bg-primary hover:shadow-lg active:scale-95",
        destructive:
          "bg-destructive/90 text-destructive-foreground backdrop-blur-md hover:bg-destructive hover:shadow-lg active:scale-95",
        outline:
          "border border-border/20 bg-transparent backdrop-blur-sm hover:bg-muted/50 hover:border-border/30 active:scale-95",
        secondary:
          "bg-secondary/80 text-secondary-foreground backdrop-blur-sm hover:bg-secondary hover:shadow-md active:scale-95",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground backdrop-blur-sm active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        "default": "h-10 px-4 py-2",
        "sm": "h-9 px-3",
        "lg": "h-11 px-8",
        "icon": "h-10 w-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
