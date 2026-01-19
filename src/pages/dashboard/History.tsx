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

const historyData = [
    { date: "2023-10-27", time: "10:30 AM", user: "Admin", action: "Export Data", details: "Downloaded results.csv" },
    { date: "2023-10-27", time: "10:15 AM", user: "Admin", action: "Run Detection", details: "Processed iot_traffic.csv" },
    { date: "2023-10-27", time: "10:00 AM", user: "Admin", action: "Upload Dataset", details: "Uploaded iot_traffic.csv (15MB)" },
    { date: "2023-10-26", time: "09:45 AM", user: "System", action: "Auto-Update", details: "Model weights updated" },
    { date: "2023-10-25", time: "04:20 PM", user: "User1", action: "Login", details: "Successful login from 192.168.1.5" },
];

export default function History() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Activity History" description="Audit log of system actions and user activities." />

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {historyData.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell>{row.date}</TableCell>
                                <TableCell className="text-muted-foreground">{row.time}</TableCell>
                                <TableCell>{row.user}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">{row.action}</Badge>
                                </TableCell>
                                <TableCell>{row.details}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
