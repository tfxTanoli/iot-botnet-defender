import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-background relative isolate grid-bg">
            {/* Ambient glow orbs */}
            <div className="pointer-events-none absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
            <div className="pointer-events-none absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-cyan-500/3 blur-[100px]" />

            {/* Sidebar */}
            <aside className="hidden w-64 border-r border-border/50 bg-card/60 backdrop-blur-xl md:block z-10 flex-shrink-0">
                <Sidebar className="h-full" />
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden z-10">
                <Header />
                <main className="flex-1 overflow-auto p-4 lg:p-6 bg-transparent">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
