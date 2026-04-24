import { useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { CheckCircle, Download, Loader2, RotateCcw, Upload, X } from "lucide-react";

const API_BASE = "http://localhost:8000";

type ColStat = {
    name:    string;
    dtype:   "numeric" | "categorical";
    missing: number;
    unique:  number;
    min:     number | null;
    max:     number | null;
    mean:    number | null;
};

type Session = {
    session_id:     string;
    filename:       string;
    rows:           number;
    cols:           number;
    duplicate_rows: number;
    preview: {
        columns: string[];
        rows:    string[][];
    };
    stats: ColStat[];
};

export default function Preprocessing() {
    const [session,          setSession]          = useState<Session | null>(null);
    const [activeTab,        setActiveTab]        = useState<"preview" | "stats">("preview");
    const [appliedSteps,     setAppliedSteps]     = useState<string[]>([]);
    const [busy,             setBusy]             = useState(false);
    const [error,            setError]            = useState<string | null>(null);

    const [missingStrategy,    setMissingStrategy]    = useState("zero");
    const [selectedDropCols,   setSelectedDropCols]   = useState<Set<string>>(new Set());
    const [selectedEncodeCols, setSelectedEncodeCols] = useState<Set<string>>(new Set());
    const [normalizeMethod,    setNormalizeMethod]    = useState("minmax");

    const fileRef = useRef<HTMLInputElement>(null);

    async function handleUpload(file: File) {
        if (!file.name.toLowerCase().endsWith(".csv")) {
            setError("Only CSV files are supported.");
            return;
        }
        setBusy(true);
        setError(null);
        const form = new FormData();
        form.append("file", file);
        try {
            const res  = await fetch(`${API_BASE}/api/preprocess/upload`, { method: "POST", body: form });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail ?? "Upload failed");
            setSession(data);
            setAppliedSteps([]);
            setSelectedDropCols(new Set());
            setSelectedEncodeCols(new Set());
            setActiveTab("preview");
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Upload failed");
        } finally {
            setBusy(false);
        }
    }

    async function applyOp(operation: object) {
        if (!session) return;
        setBusy(true);
        setError(null);
        try {
            const res  = await fetch(`${API_BASE}/api/preprocess/apply`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ session_id: session.session_id, operations: [operation] }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail ?? "Operation failed");
            setSession(prev => prev ? { ...prev, ...data, filename: prev.filename } : data);
            setAppliedSteps(prev => [...prev, ...(data.applied ?? [])]);
            setSelectedDropCols(new Set());
            setSelectedEncodeCols(new Set());
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Operation failed");
        } finally {
            setBusy(false);
        }
    }

    function handleExport() {
        if (!session) return;
        window.open(`${API_BASE}/api/preprocess/export/${session.session_id}`, "_blank");
    }

    async function handleReset() {
        if (session) {
            fetch(`${API_BASE}/api/preprocess/session/${session.session_id}`, { method: "DELETE" }).catch(() => {});
        }
        setSession(null);
        setAppliedSteps([]);
        setError(null);
        setSelectedDropCols(new Set());
        setSelectedEncodeCols(new Set());
        if (fileRef.current) fileRef.current.value = "";
    }

    function toggleCol(col: string, current: Set<string>, setter: (s: Set<string>) => void) {
        const next = new Set(current);
        next.has(col) ? next.delete(col) : next.add(col);
        setter(next);
    }

    const categoricalCols = session?.stats.filter(s => s.dtype === "categorical") ?? [];
    const totalMissing    = session?.stats.reduce((acc, s) => acc + s.missing, 0) ?? 0;

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                heading="Data Preprocessing"
                description="Upload your dataset, clean and transform it, then export the preprocessed CSV."
            />

            {/* Error banner */}
            {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm border bg-destructive/10 border-destructive/30 text-destructive">
                    <X className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="hover:opacity-70">
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}

            {!session ? (
                /* ── Upload area ── */
                <Card
                    className="border-2 border-dashed cursor-pointer hover:border-primary/50 transition-colors"
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); }}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileRef.current?.click()}
                >
                    <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                        {busy
                            ? <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                            : <Upload className="h-10 w-10 text-muted-foreground" />
                        }
                        <div className="text-center">
                            <p className="font-medium text-sm">
                                {busy ? "Uploading…" : "Drop a CSV file here, or click to browse"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Supports .csv files</p>
                        </div>
                        <input
                            ref={fileRef} type="file" accept=".csv" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                        />
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* ── File info bar ── */}
                    <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-lg border bg-muted/30 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="font-medium">{session.filename}</span>
                        <Badge variant="secondary">{session.rows.toLocaleString()} rows</Badge>
                        <Badge variant="secondary">{session.cols} columns</Badge>
                        {totalMissing > 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-400">
                                {totalMissing} missing
                            </Badge>
                        )}
                        {session.duplicate_rows > 0 && (
                            <Badge variant="outline" className="text-amber-600 border-amber-400">
                                {session.duplicate_rows} duplicates
                            </Badge>
                        )}
                        <div className="ml-auto flex gap-2">
                            <Button size="sm" variant="outline" onClick={handleReset} disabled={busy}>
                                <RotateCcw className="h-3.5 w-3.5" /> New File
                            </Button>
                            <Button size="sm" onClick={handleExport} disabled={busy}>
                                <Download className="h-3.5 w-3.5" /> Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* ── Preview / Stats tabs ── */}
                    <div>
                        <div className="flex gap-1 mb-3">
                            {(["preview", "stats"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setActiveTab(t)}
                                    className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                                        activeTab === t
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted"
                                    }`}
                                >
                                    {t === "preview" ? "Data Preview" : "Column Stats"}
                                </button>
                            ))}
                        </div>

                        {activeTab === "preview" && (
                            <Card>
                                <CardContent className="pt-4">
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Showing first {session.preview.rows.length} of {session.rows.toLocaleString()} rows
                                    </p>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    {session.preview.columns.map((col) => (
                                                        <TableHead key={col} className="whitespace-nowrap text-xs font-mono">
                                                            {col}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {session.preview.rows.map((row, i) => (
                                                    <TableRow key={i}>
                                                        {row.map((cell, j) => (
                                                            <TableCell key={j} className="text-xs font-mono py-2">
                                                                {cell}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {activeTab === "stats" && (
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Column</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Missing</TableHead>
                                                    <TableHead>Unique</TableHead>
                                                    <TableHead>Min</TableHead>
                                                    <TableHead>Max</TableHead>
                                                    <TableHead>Mean</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {session.stats.map((s) => (
                                                    <TableRow key={s.name}>
                                                        <TableCell className="font-mono text-xs">{s.name}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={s.dtype === "numeric" ? "secondary" : "outline"}
                                                                className="text-xs"
                                                            >
                                                                {s.dtype}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell
                                                            className={s.missing > 0 ? "text-amber-500 font-semibold" : "text-muted-foreground"}
                                                        >
                                                            {s.missing}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground">{s.unique}</TableCell>
                                                        <TableCell className="font-mono text-xs">{s.min ?? "—"}</TableCell>
                                                        <TableCell className="font-mono text-xs">{s.max ?? "—"}</TableCell>
                                                        <TableCell className="font-mono text-xs">{s.mean ?? "—"}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── Operation cards ── */}
                    <div className="grid gap-4 md:grid-cols-2">

                        {/* Handle Missing Values */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Handle Missing Values</CardTitle>
                                <CardDescription>
                                    {totalMissing} missing value(s) across{" "}
                                    {session.stats.filter(s => s.missing > 0).length} column(s)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-3">
                                <Select value={missingStrategy} onValueChange={setMissingStrategy}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="zero">Fill with 0</SelectItem>
                                        <SelectItem value="mean">Fill with Mean</SelectItem>
                                        <SelectItem value="median">Fill with Median</SelectItem>
                                        <SelectItem value="mode">Fill with Mode</SelectItem>
                                        <SelectItem value="drop">Drop rows</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm" disabled={busy}
                                    onClick={() => applyOp({ type: "fill_missing", strategy: missingStrategy })}
                                >
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Remove Duplicates */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Remove Duplicates</CardTitle>
                                <CardDescription>
                                    {session.duplicate_rows} duplicate row(s) detected
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button
                                    size="sm" variant="outline"
                                    disabled={busy || session.duplicate_rows === 0}
                                    onClick={() => applyOp({ type: "remove_duplicates" })}
                                >
                                    {busy
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : `Remove ${session.duplicate_rows} Row(s)`
                                    }
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Drop Columns */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Drop Columns</CardTitle>
                                <CardDescription>Select columns to remove from the dataset</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 max-h-40 overflow-y-auto pr-1">
                                    {session.stats.map((s) => (
                                        <label key={s.name} className="flex items-center gap-2 text-xs cursor-pointer">
                                            <Checkbox
                                                checked={selectedDropCols.has(s.name)}
                                                onCheckedChange={() =>
                                                    toggleCol(s.name, selectedDropCols, setSelectedDropCols)
                                                }
                                            />
                                            <span className="font-mono truncate" title={s.name}>{s.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <Button
                                    size="sm" variant="destructive"
                                    disabled={busy || selectedDropCols.size === 0}
                                    onClick={() => applyOp({ type: "drop_columns", columns: [...selectedDropCols] })}
                                >
                                    {busy
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : `Drop ${selectedDropCols.size > 0 ? selectedDropCols.size + " " : ""}Column(s)`
                                    }
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Encode Categorical */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Encode Categorical Columns</CardTitle>
                                <CardDescription>Convert text columns to numeric labels</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {categoricalCols.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No categorical columns detected.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 max-h-40 overflow-y-auto pr-1">
                                        {categoricalCols.map((s) => (
                                            <label key={s.name} className="flex items-center gap-2 text-xs cursor-pointer">
                                                <Checkbox
                                                    checked={selectedEncodeCols.has(s.name)}
                                                    onCheckedChange={() =>
                                                        toggleCol(s.name, selectedEncodeCols, setSelectedEncodeCols)
                                                    }
                                                />
                                                <span className="font-mono truncate" title={s.name}>{s.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <Button
                                    size="sm"
                                    disabled={busy || selectedEncodeCols.size === 0}
                                    onClick={() => applyOp({ type: "encode_categorical", columns: [...selectedEncodeCols] })}
                                >
                                    {busy
                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                        : `Encode ${selectedEncodeCols.size > 0 ? selectedEncodeCols.size + " " : ""}Column(s)`
                                    }
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Normalize / Scale */}
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Normalize / Scale</CardTitle>
                                <CardDescription>Scale all numeric columns to a standard range</CardDescription>
                            </CardHeader>
                            <CardContent className="flex gap-3">
                                <Select value={normalizeMethod} onValueChange={setNormalizeMethod}>
                                    <SelectTrigger className="w-64">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="minmax">MinMax Scaling — [0, 1]</SelectItem>
                                        <SelectItem value="standard">Standard Scaling — Z-score</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm" disabled={busy}
                                    onClick={() => applyOp({ type: "normalize", method: normalizeMethod })}
                                >
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Scaling"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ── Applied steps log ── */}
                    {appliedSteps.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Applied Steps</CardTitle>
                                <CardDescription>Operations applied to the dataset in this session</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ol className="space-y-2">
                                    {appliedSteps.map((step, i) => (
                                        <li key={i} className="flex items-center gap-3 text-sm">
                                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 text-xs flex items-center justify-center font-bold">
                                                {i + 1}
                                            </span>
                                            {step}
                                        </li>
                                    ))}
                                </ol>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
