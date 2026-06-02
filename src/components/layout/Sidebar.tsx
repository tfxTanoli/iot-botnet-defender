import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    UploadCloud,
    Settings2,
    ShieldAlert,
    History,
    Lightbulb,
    Shield,
} from "lucide-react";

export const sidebarItems = [
    { title: "Dashboard",         href: "/dashboard",                icon: LayoutDashboard, exact: true },
    { title: "Upload Dataset",    href: "/dashboard/upload",         icon: UploadCloud },
    { title: "Preprocessing",     href: "/dashboard/preprocessing",  icon: Settings2 },
    { title: "Detection Results", href: "/dashboard/results",        icon: ShieldAlert },
    { title: "Activity History",  href: "/dashboard/history",        icon: History },
    { title: "Recommendations",   href: "/dashboard/recommendations",icon: Lightbulb },
];

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const location = useLocation();

    return (
        <div className={cn("flex flex-col pb-6", className)}>
            {/* Brand */}
            <div className="px-5 py-5 border-b border-border/50">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <Shield className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-wide text-cyan-300">
                            Botnet Detector
                        </h2>
                        <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                            IoT Security
                        </p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                <p className="px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
                    Navigation
                </p>
                {sidebarItems.map((item) => {
                    const isActive = item.exact
                        ? location.pathname === item.href
                        : location.pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            to={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "sidebar-item-active text-cyan-300"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-cyan-400" : "")} />
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Status Footer */}
            <div className="mx-3 px-3 py-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <div>
                        <p className="text-xs font-semibold text-emerald-400">System Online</p>
                        <p className="text-[10px] text-muted-foreground">All services operational</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
