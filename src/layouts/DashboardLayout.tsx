import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout() {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar for Desktop */}
            <aside className="hidden w-64 border-r bg-card md:block">
                <Sidebar className="h-full" />
            </aside>

            <div className="flex flex-1 flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-4 lg:p-6 bg-muted/20">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
