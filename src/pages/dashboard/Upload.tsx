import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    UploadCloud, FileText, X, CheckCircle, AlertTriangle, Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const API_BASE = "http://localhost:8000";

type RowResult = {
    row: number;
    ip: string;
    mse: number;
    prediction: "MALICIOUS" | "NORMAL";
    confidence: number;
};

type Sensitivity = "high" | "medium" | "low";

type AnalysisResponse = {
    filename:    string;
    total:       number;
    malicious:   number;
    normal:      number;
    threshold:   number;
    sensitivity: Sensitivity;
    results:     RowResult[];
};

const SENSITIVITY_LABELS: Record<Sensitivity, { label: string; description: string }> = {
    high:   { label: "High",   description: "Flags more traffic — stricter detection" },
    medium: { label: "Medium", description: "Balanced (default)" },
    low:    { label: "Low",    description: "Fewer alerts — conservative detection" },
};

const CHUNK = 500;

export default function Upload() {
    const { user } = useAuth();
    const navigate  = useNavigate();

    const [dragActive, setDragActive]     = useState(false);
    const [file, setFile]                 = useState<File | null>(null);
    const [sensitivity, setSensitivity]   = useState<Sensitivity>("medium");
    const [isAnalyzing, setIsAnalyzing]   = useState(false);
    const [statusMsg, setStatusMsg]       = useState("");
    const [analysis, setAnalysis]         = useState<AnalysisResponse | null>(null);
    const [error, setError]               = useState<string | null>(null);

    // ── drag / drop ──────────────────────────────────────────────────────────
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) selectFile(dropped);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0];
        if (picked) selectFile(picked);
    };

    const selectFile = (f: File) => {
        if (!f.name.toLowerCase().endsWith(".csv")) {
            setError(`"${f.name}" is not a CSV file. Only .csv files are supported.`);
            return;
        }
        setFile(f);
        setAnalysis(null);
        setError(null);
        setStatusMsg("");
    };

    // ── save to Supabase ─────────────────────────────────────────────────────
    const saveToSupabase = async (data: AnalysisResponse) => {
        if (!user || !file) return;

        setStatusMsg("Saving dataset record…");
        await supabase.from("datasets").insert({
            user_id:    user.id,
            filename:   data.filename,
            size_bytes: file.size,
        });

        setStatusMsg("Saving detection results…");
        const rows = data.results.map((r) => ({
            user_id:    user.id,
            ip:         r.ip,
            prediction: r.prediction,
            confidence: r.confidence,
        }));
        for (let i = 0; i < rows.length; i += CHUNK) {
            await supabase.from("botnet_results").insert(rows.slice(i, i + CHUNK));
        }

        setStatusMsg("Updating traffic overview…");
        await supabase.from("traffic_overview").insert({
            user_id: user.id,
            name:    data.filename.replace(/\.csv$/i, ""),
            normal:  data.normal,
            attacks: data.malicious,
        });

        setStatusMsg("Logging activity…");
        await supabase.from("activity_history").insert({
            user_id: user.id,
            action:  "Dataset Analyzed",
            details: `${data.filename} — ${data.total} records, ${data.malicious} malicious detected`,
        });
    };

    // ── main analysis handler ────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!file || !user) return;
        setIsAnalyzing(true);
        setError(null);
        setAnalysis(null);
        setStatusMsg("Sending file to analysis server…");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const url = `${API_BASE}/api/upload?sensitivity=${sensitivity}`;
            const res = await fetch(url, {
                method: "POST",
                body:   formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ detail: "Analysis failed." }));
                throw new Error(err.detail || "Analysis failed.");
            }

            const data: AnalysisResponse = await res.json();
            await saveToSupabase(data);
            setAnalysis(data);
            setStatusMsg("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Unexpected error.";
            setError(
                msg.toLowerCase().includes("fetch")
                    ? "Cannot reach the analysis server. Run: uvicorn backend.main:app --reload --port 8000"
                    : msg,
            );
            setStatusMsg("");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ── render ───────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                heading="Upload Dataset"
                description="Upload IoT network traffic CSV for botnet detection."
            />

            <Card>
                <CardContent className="p-0">
                    <div
                        className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-colors ${
                            dragActive
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/25"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                                    {/* ── sensitivity selector (visible when no analysis yet) ── */}
                        {!analysis && (
                            <div className="w-full max-w-sm mb-6 space-y-1.5">
                                <Label className="text-sm font-medium">Detection Sensitivity</Label>
                                <Select
                                    value={sensitivity}
                                    onValueChange={(v) => setSensitivity(v as Sensitivity)}
                                    disabled={isAnalyzing}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.keys(SENSITIVITY_LABELS) as Sensitivity[]).map((key) => (
                                            <SelectItem key={key} value={key}>
                                                <span className="font-medium">
                                                    {SENSITIVITY_LABELS[key].label}
                                                </span>
                                                <span className="text-muted-foreground ml-2 text-xs">
                                                    — {SENSITIVITY_LABELS[key].description}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* ── no file selected ── */}
                        {!file && (
                            <>
                                <div className="bg-muted p-4 rounded-full mb-4">
                                    <UploadCloud className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold mb-1">
                                    Click to upload or drag and drop
                                </h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    CSV files (max 50 MB)
                                </p>
                                {error && (
                                    <div className="flex items-start gap-2 p-3 mb-4 bg-destructive/10 rounded-md text-destructive text-sm w-full max-w-sm">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                                <div className="relative">
                                    <Button>Select File</Button>
                                    <Input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept=".csv"
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}

                        {/* ── analysis complete ── */}
                        {file && analysis && (
                            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                                <div className="bg-emerald-500/10 p-4 rounded-full">
                                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div className="text-center">
                                    <p className="font-semibold text-lg">Analysis Complete</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {analysis.filename}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Sensitivity: <span className="font-medium capitalize">{analysis.sensitivity}</span>
                                        {" · "}Threshold: <span className="font-mono">{analysis.threshold.toFixed(6)}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 w-full">
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                        <p className="text-2xl font-bold">{analysis.total}</p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                    </div>
                                    <div className="text-center p-3 bg-destructive/10 rounded-lg">
                                        <p className="text-2xl font-bold text-destructive">
                                            {analysis.malicious}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Malicious</p>
                                    </div>
                                    <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                                        <p className="text-2xl font-bold text-emerald-500">
                                            {analysis.normal}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Normal</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-2 w-full">
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setFile(null);
                                            setAnalysis(null);
                                        }}
                                    >
                                        Upload Another
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={() => navigate("/dashboard/results")}
                                    >
                                        View Results
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ── file selected, not yet done ── */}
                        {file && !analysis && (
                            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                                <div className="bg-primary/10 p-4 rounded-full">
                                    <FileText className="h-8 w-8 text-primary" />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-lg">{file.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>

                                {/* status message while analyzing */}
                                {isAnalyzing && statusMsg && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>{statusMsg}</span>
                                    </div>
                                )}

                                {/* error banner */}
                                {error && (
                                    <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md text-destructive text-sm w-full">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 w-full">
                                    <Button
                                        variant="ghost"
                                        className="flex-1 text-destructive hover:text-destructive/90"
                                        onClick={() => setFile(null)}
                                        disabled={isAnalyzing}
                                    >
                                        <X className="mr-2 h-4 w-4" /> Remove
                                    </Button>
                                    <Button
                                        className="flex-1"
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing…
                                            </>
                                        ) : (
                                            "Start Analysis"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* info cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Supported Format</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            CSV files containing IoT network traffic features
                            compatible with the trained autoencoder.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <UploadCloud className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Local Processing</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            The autoencoder runs locally on your machine via the
                            FastAPI backend. No data leaves your environment.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Results Saved</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Detection results are stored in your account and visible
                            on the Results page immediately after analysis.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
