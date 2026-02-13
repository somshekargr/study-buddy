import * as React from "react"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-primary-600 text-white shadow hover:bg-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500",
                destructive:
                    "bg-red-600 text-white shadow-sm hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600",
                outline:
                    "border border-gray-300 bg-white shadow-sm hover:bg-gray-100 hover:text-gray-900 dark:border-slate-700 dark:bg-transparent dark:hover:bg-slate-800 dark:hover:text-slate-100 text-gray-900 dark:text-slate-100",
                secondary:
                    "bg-gray-200 text-gray-900 shadow-sm hover:bg-gray-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
                ghost: "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 text-gray-700 dark:text-slate-300",
                link: "text-primary-600 underline-offset-4 hover:underline dark:text-primary-400",
                glass: "bg-white/10 backdrop-blur-md border border-white/20 text-gray-900 dark:text-white hover:bg-white/20 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3 text-xs",
                lg: "h-11 rounded-md px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
