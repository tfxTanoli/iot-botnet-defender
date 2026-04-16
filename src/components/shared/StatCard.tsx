import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: string; // e.g. "+20.1% from last month"
}

export function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
    return (
        <Card className="glass-card hover:border-primary/50 transition-colors duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-wide">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-primary" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold neon-text truncate pr-2 tracking-tight">{value}</div>
                {(description || trend) && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {trend && <span className="text-emerald-500 font-medium mr-1">{trend}</span>}
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
