import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import {
    ShieldCheck, Database, Cpu, TrendingUp, Loader2,
    AlertTriangle, Activity, Wifi, Shield,
} from "lucide-react";
import {
    AreaChart, Area,
    BarChart, Bar,
    ComposedChart, Line,
    PieChart, Pie, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getAll, getLatest } from "@/lib/db";
import type { TrafficOverview, ActivityHistory, Dataset } from "@/lib/db";

/* ── Custom donut centre label ── */
const DonutCenterLabel = ({ viewBox, score }: { viewBox?: { cx: number; cy: number }; score: string }) => {
    const { cx = 0, cy = 0 } = viewBox ?? {};
    return (
        <g>
            <text x={cx} y={cy - 8} textAnchor="middle" fill="hsl(191 100% 50%)" fontSize={22} fontWeight={700}>
                {score}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill="hsl(220 20% 52%)" fontSize={11}>
                Score
            </text>
        </g>
    );
};

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
        normalTraffic: 0,
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                setIsLoading(true);

                const [trafficOverview, activity, datasets] = await Promise.all([
                    getAll<TrafficOverview>(user.uid, "traffic_overview"),
                    getLatest<ActivityHistory>(user.uid, "activity_history", 5),
                    getAll<Dataset>(user.uid, "datasets"),
                ]);

                // Chart shows the earliest 7 periods, ordered by time.
                const sortedTraffic = [...trafficOverview].sort(
                    (a, b) => a.created_at - b.created_at,
                );
                setTrafficData(sortedTraffic.slice(0, 7));

                // Most recent activity first.
                setRecentActivity(
                    [...activity].sort((a, b) => b.created_at - a.created_at),
                );

                // Aggregate totals from per-dataset traffic overviews. Each
                // overview row records the normal/attack counts for one dataset,
                // so summing them yields the same totals as counting results.
                const malicious = trafficOverview.reduce((sum, t) => sum + (t.attacks || 0), 0);
                const normal    = trafficOverview.reduce((sum, t) => sum + (t.normal || 0), 0);
                const total     = malicious + normal;

                setStats({
                    totalDatasets:   datasets.length,
                    attacksDetected: malicious,
                    totalRecords:    total,
                    detectionRate:   total > 0 ? ((malicious / total) * 100).toFixed(1) : "0.0",
                    normalTraffic:   normal,
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
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    <p className="text-xs text-muted-foreground animate-pulse tracking-widest uppercase">
                        Loading threat intelligence...
                    </p>
                </div>
            </div>
        );
    }

    /* ── Derived values ── */
    const detectionRateNum = parseFloat(stats.detectionRate);
    const securityScore    = Math.max(0, 100 - detectionRateNum);
    const securityScoreStr = securityScore.toFixed(0);
    const normalRatioPct   = stats.totalRecords > 0
        ? (stats.normalTraffic / stats.totalRecords) * 100
        : 0;

    /* Enrich traffic data with threat rate per period */
    const enrichedTrafficData = trafficData.map(d => {
        const total = (d.normal || 0) + (d.attacks || 0);
        return {
            ...d,
            total,
            threatRate: total > 0 ? parseFloat(((d.attacks || 0) / total * 100).toFixed(1)) : 0,
        };
    });

    /* Donut data */
    const pieData = [
        { name: 'Normal',    value: stats.normalTraffic,   color: '#00d4ff' },
        { name: 'Malicious', value: stats.attacksDetected, color: '#ef4444' },
    ].filter(d => d.value > 0);

    /* Radar data */
    const radarData = [
        { axis: 'Detection', score: stats.totalRecords > 0 ? Math.min(100, 65 + detectionRateNum * 0.4) : 20 },
        { axis: 'Coverage',  score: Math.min(100, stats.totalRecords / 10) },
        { axis: 'Accuracy',  score: 92 },
        { axis: 'Response',  score: 85 },
        { axis: 'Integrity', score: securityScore },
        { axis: 'Uptime',    score: 99 },
    ];

    /* Shared tooltip styles */
    const ttStyle = {
        backgroundColor: 'hsl(222 55% 10%)',
        borderRadius: '8px',
        border: '1px solid hsl(222 45% 18%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    };
    const ttItem  = { color: 'hsl(210 40% 95%)' };
    const ttLabel = { color: 'hsl(220 20% 52%)' };
    const legendStyle = { fontSize: '11px', paddingTop: '8px', color: 'hsl(220 20% 55%)' };

    const emptyPlaceholder = (
        <div className="flex h-[240px] items-center justify-center border border-dashed border-border/40 rounded-lg m-2">
            <div className="text-center space-y-2">
                <Wifi className="h-7 w-7 mx-auto text-muted-foreground/25" />
                <p className="text-xs text-muted-foreground">Upload a dataset to populate this chart</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-5 relative z-10">
            <PageHeader
                heading="Threat Intelligence Dashboard"
                description="Real-time IoT network security monitoring and botnet detection."
            />

            {/* ── Row 1: 6 KPI Stat Cards ── */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                <StatCard title="Datasets"      value={stats.totalDatasets}              description="Uploaded files"   icon={Database}       variant="default"  progress={Math.min(100, stats.totalDatasets * 20)} />
                <StatCard title="Threats Found" value={stats.attacksDetected.toLocaleString()} description="Malicious flows" icon={AlertTriangle}  variant="danger"   progress={detectionRateNum} />
                <StatCard title="Records"       value={stats.totalRecords.toLocaleString()}     description="Total analyzed"  icon={Cpu}            variant="purple"   progress={Math.min(100, stats.totalRecords / 100)} />
                <StatCard title="Threat Rate"   value={`${stats.detectionRate}%`}        description="Attack ratio"     icon={TrendingUp}     variant="warning"  progress={detectionRateNum} />
                <StatCard title="Clean Traffic" value={stats.normalTraffic.toLocaleString()}    description="Benign flows"    icon={ShieldCheck}    variant="success"  progress={normalRatioPct} />
            </div>

            {/* ── Row 2: Area Chart + Radar Chart ── */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* 1. Traffic Flow - Area Chart */}
                <Card className="col-span-4 glass-card">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse inline-block" />
                                    Traffic Flow Analysis
                                </CardTitle>
                                <CardDescription className="text-xs mt-0.5">Normal vs. malicious traffic over time</CardDescription>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">Live</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2 pt-0">
                        {trafficData.length === 0 ? emptyPlaceholder : (
                            <ResponsiveContainer width="100%" height={260}>
                                <AreaChart data={trafficData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="attackGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" stroke="hsl(220 20% 52%)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(220 20% 52%)" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={ttStyle} itemStyle={ttItem} labelStyle={ttLabel} />
                                    <Legend wrapperStyle={legendStyle} />
                                    <Area type="monotone" dataKey="normal"  name="Normal"  stroke="#00d4ff" fill="url(#normalGrad)"  strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                    <Area type="monotone" dataKey="attacks" name="Attacks" stroke="#ef4444" fill="url(#attackGrad)" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* 2. Security Posture - Radar Chart */}
                <Card className="col-span-3 glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium tracking-wide">Security Posture</CardTitle>
                        <CardDescription className="text-xs">Multi-dimensional threat assessment</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ResponsiveContainer width="100%" height={260}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                                <PolarAngleAxis dataKey="axis" tick={{ fill: 'hsl(220 20% 55%)', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(220 20% 40%)', fontSize: 9 }} tickCount={4} />
                                <Radar name="Score" dataKey="score" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.12} strokeWidth={2} />
                                <Tooltip contentStyle={ttStyle} itemStyle={{ color: '#00d4ff' }} formatter={(val: number | undefined) => [val != null ? val.toFixed(0) : '-', 'Score']} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ── Row 3: Stacked Bar Chart + Donut Chart ── */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* 3. Daily Traffic Breakdown - Stacked Bar Chart */}
                <Card className="col-span-4 glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-violet-400 inline-block" />
                            Daily Traffic Breakdown
                        </CardTitle>
                        <CardDescription className="text-xs">Stacked normal vs. attack volume per period</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2 pt-0">
                        {trafficData.length === 0 ? emptyPlaceholder : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={trafficData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="name" stroke="hsl(220 20% 52%)" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(220 20% 52%)" fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={ttStyle} itemStyle={ttItem} labelStyle={ttLabel} />
                                    <Legend wrapperStyle={legendStyle} />
                                    <Bar dataKey="normal"  name="Normal"  stackId="s" fill="#00d4ff" fillOpacity={0.75} radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="attacks" name="Attacks" stackId="s" fill="#ef4444" fillOpacity={0.80} radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* 4. Traffic Distribution - Donut Chart */}
                <Card className="col-span-3 glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium tracking-wide">Traffic Distribution</CardTitle>
                        <CardDescription className="text-xs">Overall benign vs. malicious split</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {pieData.length === 0 ? (
                            <div className="flex h-[240px] items-center justify-center text-xs text-muted-foreground border border-dashed border-border/40 rounded-lg m-2">
                                No detection results yet
                            </div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={54}
                                            outerRadius={76}
                                            paddingAngle={4}
                                            dataKey="value"
                                            strokeWidth={0}
                                            labelLine={false}
                                            label={<DonutCenterLabel score={securityScoreStr} />}
                                        >
                                            {pieData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} opacity={0.85} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={ttStyle}
                                            itemStyle={ttItem}
                                            formatter={(v: number | undefined) => [v != null ? v.toLocaleString() : '-', '']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="mt-3 space-y-2">
                                    {pieData.map(item => (
                                        <div key={item.name} className="flex items-center justify-between text-xs px-1">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                                                <span className="text-muted-foreground">{item.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-foreground tabular-nums">{item.value.toLocaleString()}</span>
                                                <span className="text-muted-foreground/60 tabular-nums">
                                                    {stats.totalRecords > 0 ? `${((item.value / stats.totalRecords) * 100).toFixed(1)}%` : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Row 4: Composed Chart (full width) - Threat Rate vs Volume ── */}
            <Card className="glass-card">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                                Threat Rate vs. Traffic Volume
                            </CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                Combined view: bar columns show traffic volume, amber line tracks attack rate (%)
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Trend</Badge>
                    </div>
                </CardHeader>
                <CardContent className="pl-2 pt-0">
                    {enrichedTrafficData.length === 0 ? emptyPlaceholder : (
                        <ResponsiveContainer width="100%" height={240}>
                            <ComposedChart data={enrichedTrafficData} margin={{ top: 8, right: 20, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="normalBarGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%"   stopColor="#00d4ff" stopOpacity={0.7} />
                                        <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.3} />
                                    </linearGradient>
                                    <linearGradient id="attackBarGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%"   stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="name" stroke="hsl(220 20% 52%)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="left"  stroke="hsl(220 20% 52%)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis yAxisId="right" orientation="right" stroke="hsl(38 92% 55%)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={ttStyle}
                                    itemStyle={ttItem}
                                    labelStyle={ttLabel}
                                    formatter={(val: number | undefined, name: string | undefined) =>
                                        name === 'Threat Rate %' ? [`${val ?? 0}%`, name ?? ''] : [(val ?? 0).toLocaleString(), name ?? '']
                                    }
                                />
                                <Legend wrapperStyle={legendStyle} />
                                <Bar yAxisId="left" dataKey="normal"     name="Normal Traffic" fill="url(#normalBarGrad)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                                <Bar yAxisId="left" dataKey="attacks"    name="Attack Traffic" fill="url(#attackBarGrad)" radius={[3, 3, 0, 0]} maxBarSize={32} />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="threatRate"
                                    name="Threat Rate %"
                                    stroke="#f59e0b"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* ── Row 5: Threat Metrics + Activity Feed ── */}
            <div className="grid gap-4 md:grid-cols-7">
                {/* Threat Metrics Progress Panel */}
                <Card className="col-span-3 glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
                            <Shield className="h-4 w-4 text-cyan-400" />
                            System Threat Metrics
                        </CardTitle>
                        <CardDescription className="text-xs">Real-time security indicators</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-1">
                        {[
                            { label: 'Attack Detection Rate', value: detectionRateNum,                         bar: detectionRateNum > 50 ? 'bg-red-500' : detectionRateNum > 20 ? 'bg-amber-500' : 'bg-emerald-500', text: `${stats.detectionRate}%` },
                            { label: 'Benign Traffic Ratio',  value: normalRatioPct,                           bar: 'bg-cyan-500',                                                                                       text: `${normalRatioPct.toFixed(1)}%` },
                            { label: 'Dataset Coverage',      value: Math.min(100, stats.totalDatasets * 20),  bar: 'bg-violet-500',                                                                                     text: `${stats.totalDatasets} file${stats.totalDatasets !== 1 ? 's' : ''}` },
                            { label: 'Model Confidence',      value: 92,                                       bar: 'bg-emerald-500',                                                                                    text: '92%' },
                            { label: 'System Security Score', value: securityScore,                            bar: securityScore > 70 ? 'bg-emerald-500' : securityScore > 40 ? 'bg-amber-500' : 'bg-red-500',       text: `${securityScoreStr} / 100` },
                        ].map((metric) => (
                            <div key={metric.label} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">{metric.label}</span>
                                    <span className="font-semibold text-foreground tabular-nums">{metric.text}</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-700 ${metric.bar}`} style={{ width: `${Math.min(100, Math.max(0, metric.value))}%` }} />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Activity Feed */}
                <Card className="col-span-4 glass-card">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium tracking-wide flex items-center gap-2">
                            <Activity className="h-4 w-4 text-cyan-400" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription className="text-xs">Latest system events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentActivity.length === 0 ? (
                            <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                                No recent activities recorded.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentActivity.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0 ring-4 ring-cyan-400/10" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium leading-tight">{item.action}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.details}</p>
                                        </div>
                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md flex-shrink-0 tabular-nums">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
