import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Activity, ShieldCheck, Database, FileWarning } from "lucide-react";
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

const data = [
    { name: "Mon", attacks: 40, normal: 240 },
    { name: "Tue", attacks: 30, normal: 398 },
    { name: "Wed", attacks: 200, normal: 980 },
    { name: "Thu", attacks: 278, normal: 308 },
    { name: "Fri", attacks: 189, normal: 480 },
    { name: "Sat", attacks: 239, normal: 380 },
    { name: "Sun", attacks: 349, normal: 430 },
];

export default function DashboardHome() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Dashboard" description="Overview of system activity and botnet detection." />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Datasets"
                    value="12"
                    description="Uploaded this month"
                    icon={Database}
                />
                <StatCard
                    title="Attacks Detected"
                    value="1,324"
                    trend="+15%"
                    description="vs. last month"
                    icon={ShieldCheck}
                />
                <StatCard
                    title="Active Threats"
                    value="24"
                    description="Require immediate attention"
                    trend="+5%"
                    icon={FileWarning}
                />
                <StatCard
                    title="System Status"
                    value="Healthy"
                    description="All systems operational"
                    icon={Activity}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Traffic Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Bar dataKey="normal" name="Normal Traffic" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="attacks" name="Attacks" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                {
                                    name: "Dataset Uploaded",
                                    desc: "iot_network_traffic.csv",
                                    time: "2 mins ago"
                                },
                                {
                                    name: "Analysis Completed",
                                    desc: "Found 234 threats",
                                    time: "1 hour ago"
                                },
                                {
                                    name: "Export Generated",
                                    desc: "report_2023_10.pdf",
                                    time: "3 hours ago"
                                },
                                {
                                    name: "System Update",
                                    desc: "Patch v2.1 applied",
                                    time: "1 day ago"
                                }
                            ].map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-muted-foreground">{item.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
