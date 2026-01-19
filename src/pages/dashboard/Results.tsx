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
import { ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";

const pieData = [
    { name: "Normal", value: 400, color: "hsl(var(--primary))" },
    { name: "DDoS", value: 300, color: "hsl(var(--destructive))" },
    { name: "Botnet", value: 300, color: "hsl(var(--chart-4))" },
    { name: "Brute Force", value: 200, color: "hsl(var(--chart-5))" },
];

const resultsData = [
    { id: "REC-001", ip: "192.168.1.105", timestamp: "2023-10-27 10:23:45", prediction: "Normal", confidence: 99.8 },
    { id: "REC-002", ip: "192.168.1.112", timestamp: "2023-10-27 10:23:48", prediction: "DDoS Attack", confidence: 94.2 },
    { id: "REC-003", ip: "10.0.0.45", timestamp: "2023-10-27 10:24:01", prediction: "Botnet C&C", confidence: 88.5 },
    { id: "REC-004", ip: "192.168.1.105", timestamp: "2023-10-27 10:24:12", prediction: "Normal", confidence: 98.1 },
    { id: "REC-005", ip: "172.16.0.23", timestamp: "2023-10-27 10:24:45", prediction: "Brute Force", confidence: 91.0 },
];

export default function Results() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Botnet Detection Results" description="Analysis results and threat classification." />

            <div className="grid gap-4 md:grid-cols-3">
                <StatCard title="Total Records" value="12,450" icon={CheckCircle} />
                <StatCard title="Attacks Detected" value="845" icon={AlertTriangle} trend="6.8% rate" />
                <StatCard title="Clean Traffic" value="11,605" icon={ShieldCheck} />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Attack Distribution</CardTitle>
                        <CardDescription>Breakdown of detected threats.</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {pieData.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-medium">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Detailed Logs</CardTitle>
                        <CardDescription>Recent traffic analysis records.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Record ID</TableHead>
                                    <TableHead>Source IP</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Prediction</TableHead>
                                    <TableHead className="text-right">Confidence</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {resultsData.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell className="font-medium">{row.id}</TableCell>
                                        <TableCell>{row.ip}</TableCell>
                                        <TableCell>{row.timestamp}</TableCell>
                                        <TableCell>
                                            <Badge variant={row.prediction === "Normal" ? "secondary" : "destructive"}>
                                                {row.prediction}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{row.confidence}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
