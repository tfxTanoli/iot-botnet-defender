import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Shield, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "./Sidebar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();

    const handleLogOut = async () => {
        await signOut();
        navigate("/login");
    };

    const userEmail    = user?.email || "No Email";
    const userFullName = user?.displayName || "IoT User";
    const initials     = userFullName.substring(0, 2).toUpperCase();

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/50 bg-card/70 backdrop-blur-xl px-4 lg:px-6">
            {/* Mobile menu */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden border-border/50 bg-card/50">
                        <Menu className="h-4 w-4" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-card border-border/50">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            {/* Left - title */}
            <div className="flex items-center gap-2.5 flex-1">
                <Shield className="h-4 w-4 text-cyan-400 hidden sm:block" />
                <span className="text-sm font-semibold text-foreground hidden sm:block">
                    IoT Security Dashboard
                </span>
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 hidden sm:flex items-center gap-1">
                    <Wifi className="h-2.5 w-2.5" />
                    Live
                </Badge>
            </div>

            {/* Right - user menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full ring-1 ring-border/50 hover:ring-cyan-500/40 transition-all">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-cyan-500/10 text-cyan-300 text-xs font-semibold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border/60" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userFullName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem onClick={handleLogOut} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </header>
    );
}
