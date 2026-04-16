import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-background relative isolate">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/10 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse pointer-events-none" />
            <div className="absolute top-0 -right-40 w-96 h-96 bg-primary/5 rounded-full mix-blend-screen filter blur-[100px] opacity-70 pointer-events-none" />
            
            {/* Sidebar for Desktop */}
            <aside className="hidden w-64 border-r border-border/50 bg-card/50 backdrop-blur-xl md:block z-10">
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
