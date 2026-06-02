import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = 'default' | 'danger' | 'success' | 'warning' | 'purple';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: string;
    variant?: Variant;
    progress?: number; // 0–100
}

const variantConfig: Record<Variant, {
    iconColor: string;
    iconBg: string;
    borderHover: string;
    progressBar: string;
    shadowHover: string;
    valueColor: string;
}> = {
    default: {
        iconColor: 'text-cyan-400',
        iconBg: 'bg-cyan-500/10',
        borderHover: 'hover:border-cyan-500/40',
        progressBar: 'bg-gradient-to-r from-cyan-500 to-cyan-300',
        shadowHover: 'hover:shadow-[0_0_30px_rgba(0,212,255,0.12)]',
        valueColor: 'text-cyan-300',
    },
    danger: {
        iconColor: 'text-red-400',
        iconBg: 'bg-red-500/10',
        borderHover: 'hover:border-red-500/40',
        progressBar: 'bg-gradient-to-r from-red-500 to-red-400',
        shadowHover: 'hover:shadow-[0_0_30px_rgba(239,68,68,0.12)]',
        valueColor: 'text-red-300',
    },
    success: {
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10',
        borderHover: 'hover:border-emerald-500/40',
        progressBar: 'bg-gradient-to-r from-emerald-500 to-emerald-300',
        shadowHover: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]',
        valueColor: 'text-emerald-300',
    },
    warning: {
        iconColor: 'text-amber-400',
        iconBg: 'bg-amber-500/10',
        borderHover: 'hover:border-amber-500/40',
        progressBar: 'bg-gradient-to-r from-amber-500 to-amber-300',
        shadowHover: 'hover:shadow-[0_0_30px_rgba(245,158,11,0.12)]',
        valueColor: 'text-amber-300',
    },
    purple: {
        iconColor: 'text-violet-400',
        iconBg: 'bg-violet-500/10',
        borderHover: 'hover:border-violet-500/40',
        progressBar: 'bg-gradient-to-r from-violet-500 to-violet-300',
        shadowHover: 'hover:shadow-[0_0_30px_rgba(139,92,246,0.12)]',
        valueColor: 'text-violet-300',
    },
};

export function StatCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = 'default',
    progress,
}: StatCardProps) {
    const cfg = variantConfig[variant];

    return (
        <Card className={cn(
            "glass-card transition-all duration-300 cursor-default group",
            cfg.borderHover,
            cfg.shadowHover,
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className={cn("p-1.5 rounded-lg transition-colors", cfg.iconBg)}>
                        <Icon className={cn("h-3.5 w-3.5", cfg.iconColor)} />
                    </div>
                )}
            </CardHeader>
            <CardContent className="pt-0">
                <div className={cn("text-2xl font-bold tracking-tight truncate", cfg.valueColor)}>
                    {value}
                </div>
                {(description || trend) && (
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        {trend && <span className={cn("font-semibold", cfg.iconColor)}>{trend}</span>}
                        {description}
                    </p>
                )}
                {progress !== undefined && (
                    <div className="mt-3">
                        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn("h-full rounded-full transition-all duration-700", cfg.progressBar)}
                                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
