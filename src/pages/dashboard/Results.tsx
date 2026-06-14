import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { ShieldCheck, AlertTriangle, CheckCircle, Loader2, Search, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAll, getLatest } from "@/lib/db";
import type { BotnetResult, TrafficOverview } from "@/lib/db";

type ResultRow = {
    id: string;
    ip: string;
    prediction: string;
    confidence: number;
    created_at: number;
};

export default function Results() {
    const { user } = useAuth();
    const [tableRows, setTableRows]           = useState<ResultRow[]>([]);
    const [totalCount, setTotalCount]         = useState(0);
    const [maliciousCount, setMaliciousCount] = useState(0);
    const [isLoading, setIsLoading]           = useState(true);

    // Filter state
    const [filterPrediction, setFilterPrediction] = useState<string>("ALL");
    const [filterDateFrom, setFilterDateFrom]     = useState<string>("");
    const [filterDateTo, setFilterDateTo]         = useState<string>("");
    const [filterIP, setFilterIP]                 = useState<string>("");

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            setIsLoading(true);
            const [trafficOverview, latestResults] = await Promise.all([
                getAll<TrafficOverview>(user.uid, "traffic_overview"),
                getLatest<BotnetResult>(user.uid, "botnet_results", 1000),
            ]);

            // Totals are aggregated from the per-dataset traffic overviews.
            const malicious = trafficOverview.reduce((sum, t) => sum + (t.attacks || 0), 0);
            const normal    = trafficOverview.reduce((sum, t) => sum + (t.normal || 0), 0);

            // Newest results first for the table.
            const rows = [...latestResults].sort(
                (a, b) => b.created_at - a.created_at,
            );

            setTotalCount(malicious + normal);
            setMaliciousCount(malicious);
            setTableRows(rows as ResultRow[]);
            setIsLoading(false);
        };
        load();
    }, [user]);

    const total     = totalCount;
    const malicious = maliciousCount;
    const normal    = total - malicious;

    const colorMap: Record<string, string> = {
        NORMAL:    "hsl(var(--primary))",
        MALICIOUS: "hsl(var(--destructive))",
    };

    const pieData = [
        { name: "NORMAL",    value: normal,    color: colorMap.NORMAL },
        { name: "MALICIOUS", value: malicious, color: colorMap.MALICIOUS },
    ].filter((d) => d.value > 0);

    const filteredRows = useMemo(() => {
        return tableRows.filter((row) => {
            if (filterPrediction !== "ALL" && row.prediction !== filterPrediction) return false;
            if (filterIP && !row.ip.includes(filterIP.trim())) return false;
            const ts = new Date(row.created_at);
            if (filterDateFrom) {
                const from = new Date(filterDateFrom);
                from.setHours(0, 0, 0, 0);
                if (ts < from) return false;
            }
            if (filterDateTo) {
                const to = new Date(filterDateTo);
                to.setHours(23, 59, 59, 999);
                if (ts > to) return false;
            }
            return true;
        });
    }, [tableRows, filterPrediction, filterIP, filterDateFrom, filterDateTo]);

    const hasActiveFilters =
        filterPrediction !== "ALL" || filterIP !== "" || filterDateFrom !== "" || filterDateTo !== "";

    const clearFilters = () => {
        setFilterPrediction("ALL");
        setFilterIP("");
        setFilterDateFrom("");
        setFilterDateTo("");
    };

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
                description={`Analysis results for ${user?.displayName || "User"}.`}
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
                            {total > 1000
                                ? `Showing latest 1,000 of ${total.toLocaleString()} records.`
                                : "Per-record predictions with confidence scores."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Filters */}
                        <div className="mb-4 flex flex-wrap gap-2 items-end">
                            {/* IP search */}
                            <div className="relative flex-1 min-w-[140px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search IP..."
                                    value={filterIP}
                                    onChange={(e) => setFilterIP(e.target.value)}
                                    className="pl-8 h-9 bg-muted/30 border-border/50 text-sm"
                                />
                            </div>

                            {/* Prediction filter */}
                            <Select value={filterPrediction} onValueChange={setFilterPrediction}>
                                <SelectTrigger className="w-[140px] h-9 bg-muted/30 border-border/50 text-sm">
                                    <SelectValue placeholder="Prediction" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Types</SelectItem>
                                    <SelectItem value="NORMAL">Normal</SelectItem>
                                    <SelectItem value="MALICIOUS">Malicious</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Date From */}
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground px-1">From</span>
                                <Input
                                    type="date"
                                    value={filterDateFrom}
                                    onChange={(e) => setFilterDateFrom(e.target.value)}
                                    className="h-9 w-[150px] bg-muted/30 border-border/50 text-sm"
                                />
                            </div>

                            {/* Date To */}
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] text-muted-foreground px-1">To</span>
                                <Input
                                    type="date"
                                    value={filterDateTo}
                                    onChange={(e) => setFilterDateTo(e.target.value)}
                                    className="h-9 w-[150px] bg-muted/30 border-border/50 text-sm"
                                />
                            </div>

                            {/* Clear button */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="h-9 px-2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        {/* Results count */}
                        {hasActiveFilters && (
                            <p className="text-xs text-muted-foreground mb-3">
                                Showing {filteredRows.length} of {tableRows.length} loaded records
                            </p>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Record ID</TableHead>
                                    <TableHead>Source IP</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Prediction</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tableRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No detection logs yet. Upload a dataset to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-24 text-center text-muted-foreground"
                                        >
                                            No records match the selected filters.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRows.map((row) => (
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
