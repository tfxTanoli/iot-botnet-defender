import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UploadCloud, FileText, X } from "lucide-react";
import { useState } from "react";

export default function Upload() {
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader heading="Upload Dataset" description="Upload IoT network traffic data for analysis." />

            <Card>
                <CardContent className="p-0">
                    <div
                        className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        {!file ? (
                            <>
                                <div className="bg-muted p-4 rounded-full mb-4">
                                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">Click to upload or drag and drop</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    CSV, JSON or PCAP files (MAX. 50MB)
                                </p>
                                <div className="relative">
                                    <Button>Select File</Button>
                                    <Input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".csv,.json,.pcap"
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <div className="bg-primary/10 p-4 rounded-full">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-lg">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <Button variant="ghost" onClick={() => setFile(null)} className="text-destructive hover:text-destructive/90">
                                    <X className="mr-2 h-4 w-4" /> Remove File
                                </Button>
                                <Button className="mt-2 w-full max-w-xs">Start Analysis</Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Supported Formats</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            We support CSV, JSON, and standard PCAP files for network traffic analysis.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <UploadCloud className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Secure Upload</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            All uploads are encrypted and processed locally within the dashboard environment.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Data Retention</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Uploaded files are automatically deleted after 24 hours or upon manual deletion.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
