import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Loader2, Monitor, Smartphone } from "lucide-react";

export default function History() {
    const { user } = useAuth();
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('activity_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });
                
                if (data) {
                    setHistoryData(data);
                }
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Activity History" description="Audit log of system actions and user activities." />

            <div className="rounded-md border bg-card relative min-h-[300px]">
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : null}
                
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                            <TableHead>Device</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!isLoading && historyData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No activity history available.
                                </TableCell>
                            </TableRow>
                        ) : (
                            historyData.map((row, index) => {
                                const isMobile = row.device_type === "Mobile";
                                return (
                                    <TableRow key={index}>
                                        <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-muted-foreground">{new Date(row.created_at).toLocaleTimeString()}</TableCell>
                                        <TableCell>{user?.user_metadata?.full_name || 'User'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{row.action}</Badge>
                                        </TableCell>
                                        <TableCell>{row.details}</TableCell>
                                        <TableCell>
                                            {row.device_type ? (
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {isMobile
                                                            ? <Smartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                            : <Monitor className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                        }
                                                        <span className="text-sm font-medium">{row.device_type}</span>
                                                    </div>
                                                    {row.ip_address && (
                                                        <span className="text-xs text-muted-foreground font-mono">{row.ip_address}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

