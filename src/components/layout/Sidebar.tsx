import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    UploadCloud,
    Settings2,
    ShieldAlert,
    History,
    Activity
} from "lucide-react";

export const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true
    },
    {
        title: "Upload Dataset",
        href: "/dashboard/upload",
        icon: UploadCloud,
    },
    {
        title: "Preprocessing",
        href: "/dashboard/preprocessing",
        icon: Settings2,
    },
    {
        title: "Detection Results",
        href: "/dashboard/results",
        icon: ShieldAlert,
    },
    {
        title: "Activity History",
        href: "/dashboard/history",
        icon: History,
    },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation();

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <div className="flex items-center px-4 mb-6">
                        <Activity className="h-6 w-6 mr-2 text-primary" />
                        <h2 className="text-lg font-semibold tracking-tight">
                            Botnet Defender
                        </h2>
                    </div>
                    <div className="space-y-1">
                        {sidebarItems.map((item) => (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary",
                                    location.pathname === item.href
                                        ? "bg-secondary text-primary"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
