import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { ShieldCheck, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Results() {
    const { user } = useAuth();
    const [resultsData, setResultsData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from('botnet_results') 
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false }); 
                
                if (data) {
                    setResultsData(data);
                }
            } catch (err) {
                console.error("Error fetching data:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    // Compute stats from dynamic data
    const totalRecords = resultsData.length;
    const attacksDetected = resultsData.filter(r => r.prediction !== 'Normal').length;
    const cleanTraffic = totalRecords - attacksDetected;

    // Compute Pie Chart Data dynamic
    const pieDataMap = resultsData.reduce((acc: any, row) => {
        const pred = row.prediction || "Unknown";
        acc[pred] = (acc[pred] || 0) + 1;
        return acc;
    }, {});

    const colorMap: Record<string, string> = {
        "Normal": "hsl(var(--primary))",
        "DDoS Attack": "hsl(var(--destructive))",
        "Botnet C&C": "hsl(var(--chart-4))",
        "Brute Force": "hsl(var(--chart-5))",
        "Unknown": "hsl(var(--muted-foreground))"
    };

    const pieData = Object.keys(pieDataMap).map(key => ({
        name: key,
        value: pieDataMap[key],
        color: colorMap[key] || "hsl(var(--chart-2))"
    }));

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 relative z-10">
            <PageHeader heading="Botnet Detection Results" description={`Analysis results for ${user?.user_metadata?.full_name || 'User'}.`} />

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Records" value={totalRecords.toString()} icon={CheckCircle} />
                <StatCard title="Attacks Detected" value={attacksDetected.toString()} icon={AlertTriangle} trend={totalRecords > 0 ? `${((attacksDetected/totalRecords)*100).toFixed(1)}% rate` : "0% rate"} />
                <StatCard title="Clean Traffic" value={cleanTraffic.toString()} icon={ShieldCheck} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 glass-card">
                    <CardHeader>
                        <CardTitle className="font-medium tracking-wide">Attack Distribution</CardTitle>
                        <CardDescription>Breakdown of detected threats.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {totalRecords === 0 ? (
                            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                                No threat details available.
                            </div>
                        ) : (
                            <>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="hsl(var(--card))"
                                                strokeWidth={2}
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {pieData.map((item) => (
                                        <div key={item.name} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="h-3 w-3 rounded-full shadow-md" style={{ backgroundColor: item.color }} />
                                                <span className="font-medium">{item.name}</span>
                                            </div>
                                            <span className="font-bold">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2 glass-card">
                    <CardHeader>
                        <CardTitle className="font-medium tracking-wide">Detailed Logs</CardTitle>
                        <CardDescription>Recent traffic analysis records.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Record ID</TableHead>
                                    <TableHead>Source IP</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Prediction</TableHead>
                                    <TableHead className="text-right">Confidence</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resultsData.length === 0 ? (
                                     <TableRow>
                                         <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                             No detection logs available.
                                         </TableCell>
                                     </TableRow>
                                ) : (
                                    resultsData.map((row) => (
                                        <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium font-mono text-xs">{row.id.substring(0, 8)}</TableCell>
                                            <TableCell className="font-mono text-xs">{row.ip}</TableCell>
                                            <TableCell className="text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <Badge variant={row.prediction === "Normal" ? "secondary" : "destructive"} className="shadow-sm">
                                                    {row.prediction}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-emerald-500">{row.confidence}%</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
