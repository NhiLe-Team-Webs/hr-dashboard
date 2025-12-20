import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "default" | "lg" | "xl";
}

export function LoadingSpinner({ className, size = "default", ...props }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        default: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)} {...props}>
            <div className={cn("relative flex items-center justify-center", sizeClasses[size])}>
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-2 rounded-full border-4 border-blue-400/20" />
                <div className="absolute inset-2 rounded-full border-4 border-blue-400 border-b-transparent animate-spin direction-reverse" />
            </div>
        </div>
    );
}

export function LoadingPage() {
    return (
        <div className="h-[50vh] flex items-center justify-center">
            <LoadingSpinner size="xl" />
        </div>
    );
}
