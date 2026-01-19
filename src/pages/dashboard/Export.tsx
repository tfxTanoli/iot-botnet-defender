import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download } from "lucide-react";

export default function Export() {
    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Export Data" description="Download analysis results and reports." />

            <Card className="max-w-xl">
                <CardHeader>
                    <CardTitle>Export Options</CardTitle>
                    <CardDescription>Select the format and data you wish to export.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <Label>File Format</Label>
                        <RadioGroup defaultValue="csv">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="csv" id="csv" />
                                <Label htmlFor="csv">CSV (Comma Separated Values)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="json" id="json" />
                                <Label htmlFor="json">JSON (JavaScript Object Notation)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pdf" id="pdf" />
                                <Label htmlFor="pdf">PDF Report (Summary & Charts)</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button>
                        <Download className="mr-2 h-4 w-4" /> Download File
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
