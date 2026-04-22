import { useEffect, useState } from "react";
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

type ResultRow = {
    id: string;
    ip: string;
    prediction: string;
    confidence: number;
    created_at: string;
};

export default function Results() {
    const { user } = useAuth();
    const [resultsData, setResultsData] = useState<ResultRow[]>([]);
    const [isLoading, setIsLoading]     = useState(true);

    useEffect(() => {
        if (!user) return;
        const fetch = async () => {
            setIsLoading(true);
            const { data } = await supabase
                .from("botnet_results")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });
            if (data) setResultsData(data as ResultRow[]);
            setIsLoading(false);
        };
        fetch();
    }, [user]);

    const total     = resultsData.length;
    const malicious = resultsData.filter((r) => r.prediction === "MALICIOUS").length;
    const normal    = total - malicious;

    // pie chart — count by prediction label
    const pieDataMap = resultsData.reduce<Record<string, number>>((acc, r) => {
        const label = r.prediction || "Unknown";
        acc[label]  = (acc[label] || 0) + 1;
        return acc;
    }, {});

    const colorMap: Record<string, string> = {
        NORMAL:    "hsl(var(--primary))",
        MALICIOUS: "hsl(var(--destructive))",
        Unknown:   "hsl(var(--muted-foreground))",
    };

    const pieData = Object.entries(pieDataMap).map(([name, value]) => ({
        name,
        value,
        color: colorMap[name] ?? "hsl(var(--chart-2))",
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
            <PageHeader
                heading="Botnet Detection Results"
                description={`Analysis results for ${user?.user_metadata?.full_name || "User"}.`}
            />

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Records"     value={total.toString()}     icon={CheckCircle} />
                <StatCard
                    title="Malicious Detected"
                    value={malicious.toString()}
                    icon={AlertTriangle}
                    trend={total > 0 ? `${((malicious / total) * 100).toFixed(1)}% rate` : "0% rate"}
                />
                <StatCard title="Normal Traffic" value={normal.toString()} icon={ShieldCheck} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* ── Pie chart ── */}
                <Card className="md:col-span-1 glass-card">
                    <CardHeader>
                        <CardTitle className="font-medium tracking-wide">
                            Traffic Distribution
                        </CardTitle>
                        <CardDescription>Breakdown of detection outcomes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {total === 0 ? (
                            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                                No data available. Upload a dataset first.
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
                                                {pieData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "hsl(var(--card))",
                                                    borderRadius: "8px",
                                                    border: "1px solid hsl(var(--border))",
                                                }}
                                                itemStyle={{ color: "hsl(var(--foreground))" }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {pieData.map((item) => (
                                        <div
                                            key={item.name}
                                            className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
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

                {/* ── Table ── */}
                <Card className="md:col-span-2 glass-card">
                    <CardHeader>
                        <CardTitle className="font-medium tracking-wide">Detection Logs</CardTitle>
                        <CardDescription>
                            Per-record predictions with confidence scores.
                        </CardDescription>
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
                                        <TableCell
                                            colSpan={5}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No detection logs yet. Upload a dataset to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    resultsData.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            className="hover:bg-muted/30 transition-colors"
                                        >
                                            <TableCell className="font-mono text-xs">
                                                {row.id.substring(0, 8)}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {row.ip}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(row.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        row.prediction === "NORMAL"
                                                            ? "secondary"
                                                            : "destructive"
                                                    }
                                                >
                                                    {row.prediction}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                <span
                                                    className={
                                                        row.prediction === "NORMAL"
                                                            ? "text-emerald-500"
                                                            : "text-destructive"
                                                    }
                                                >
                                                    {row.confidence}%
                                                </span>
                                            </TableCell>
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
