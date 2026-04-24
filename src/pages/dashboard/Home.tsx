import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { ShieldCheck, Database, Cpu, TrendingUp, Loader2 } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function DashboardHome() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [trafficData, setTrafficData] = useState<any[]>([]);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalDatasets: 0,
        attacksDetected: 0,
        totalRecords: 0,
        detectionRate: "0.0",
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            
            try {
                setIsLoading(true);
                // In a production app, these would be real tables or RPC calls
                
                // Fetch traffic distribution (simplified)
                const { data: trafficOverview } = await supabase
                    .from('traffic_overview')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true })
                    .limit(7);

                if (trafficOverview) setTrafficData(trafficOverview);

                // Fetch recent activity
                const { data: activity } = await supabase
                    .from('activity_history')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (activity) setRecentActivity(activity);

                // Fetch high level stats
                const { count: datasetCount } = await supabase
                    .from('datasets')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);
                    
                const { count: attacksCount } = await supabase
                    .from('botnet_results')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('prediction', 'MALICIOUS');

                const { count: totalRecordsCount } = await supabase
                    .from('botnet_results')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                const malicious = attacksCount || 0;
                const total     = totalRecordsCount || 0;

                setStats({
                    totalDatasets:  datasetCount || 0,
                    attacksDetected: malicious,
                    totalRecords:   total,
                    detectionRate:  total > 0 ? ((malicious / total) * 100).toFixed(1) : "0.0",
                });
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (isLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 relative z-10">
            <PageHeader heading="Dashboard" description="Overview of system activity and botnet detection." />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Datasets"
                    value={stats.totalDatasets.toString()}
                    description="Personal datasets"
                    icon={Database}
                />
                <StatCard
                    title="Attacks Detected"
                    value={stats.attacksDetected.toString()}
                    trend={stats.attacksDetected > 0 ? "Threats verified" : ""}
                    description="Total recorded attacks"
                    icon={ShieldCheck}
                />
                <StatCard
                    title="Total Records Analyzed"
                    value={stats.totalRecords.toLocaleString()}
                    description="Rows processed by the model"
                    icon={Cpu}
                />
                <StatCard
                    title="Detection Rate"
                    value={`${stats.detectionRate}%`}
                    description="Of all analyzed traffic"
                    trend={stats.totalRecords > 0 ? "Malicious ratio" : ""}
                    icon={TrendingUp}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 glass-card">
                    <CardHeader>
                        <CardTitle className="font-medium tracking-wide">Traffic Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {trafficData.length === 0 ? (
                            <div className="flex h-[350px] items-center justify-center text-muted-foreground text-sm border border-dashed rounded-md m-4">
                                No traffic data available yet.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={trafficData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.2)" />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="hsl(var(--muted-foreground))"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: 'hsl(var(--muted) / 0.5)' }}
                                    />
                                    <Bar dataKey="normal" name="Normal Traffic" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="attacks" name="Attacks" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
                <Card className="col-span-3 glass-card">
                    <CardHeader>
                        <CardTitle className="font-medium tracking-wide">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No recent activities recorded.
                                </div>
                            ) : (
                                recentActivity.map((item, index) => (
                                    <div key={index} className="flex items-center group">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none group-hover:text-primary transition-colors">{item.action}</p>
                                            <p className="text-sm text-muted-foreground">{item.details}</p>
                                        </div>
                                        <div className="ml-auto font-medium text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
