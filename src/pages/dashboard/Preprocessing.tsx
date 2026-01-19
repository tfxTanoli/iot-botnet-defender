import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Play } from "lucide-react";

export default function Preprocessing() {
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleRun = () => {
        setProcessing(true);
        setProgress(0);
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setProcessing(false);
                    return 100;
                }
                return prev + 10;
            })
        }, 500);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Preprocessing & Feature Engineering" description="Configure dataset preparation steps before analysis." />

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Data Cleaning</CardTitle>
                        <CardDescription>Select methods to clean and prepare the raw data.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="missing" defaultChecked />
                            <Label htmlFor="missing">Handle Missing Values</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="duplicates" defaultChecked />
                            <Label htmlFor="duplicates">Remove Duplicates</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="outliers" />
                            <Label htmlFor="outliers">Outlier Detection & Removal</Label>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Transformation</CardTitle>
                        <CardDescription>Apply scaling and encoding techniques.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Scaling Method</Label>
                            <Select defaultValue="standard">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select scaling" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard Scaler (Z-score)</SelectItem>
                                    <SelectItem value="minmax">Min-Max Scaler</SelectItem>
                                    <SelectItem value="robust">Robust Scaler</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Encoding Strategy</Label>
                            <Select defaultValue="label">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select encoding" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="label">Label Encoding</SelectItem>
                                    <SelectItem value="onehot">One-Hot Encoding</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Feature Selection</CardTitle>
                        <CardDescription>Choose relevant features for the detection model.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {["Packet Size", "Duration", "Source IP", "Dest IP", "Protocol", "Flag", "Service", "Count"].map((feature) => (
                                <div key={feature} className="flex items-center space-x-2">
                                    <Checkbox id={`feature-${feature}`} defaultChecked />
                                    <Label htmlFor={`feature-${feature}`}>{feature}</Label>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col gap-4">
                {processing && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Processing dataset...</span>
                            <span>{progress}%</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                )}
                <Button size="lg" className="w-fit" onClick={handleRun} disabled={processing}>
                    {processing ? "Processing..." : (
                        <>
                            <Play className="mr-2 h-4 w-4" /> Run Preprocessing
                        </>
                    )}

                </Button>
            </div>
        </div>
    );
}
