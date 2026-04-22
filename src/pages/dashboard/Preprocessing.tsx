import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const API_BASE = "http://localhost:8000";

type ModelInfo = {
    model:                   string;
    feature_cols:            string[];
    threshold:               number;
    sensitivity_thresholds:  Record<string, number>;
    description:             string;
};

const PIPELINE_STEPS = [
    {
        n: "1",
        title: "Feature Extraction",
        detail: "Select model feature columns from the uploaded CSV. Missing columns are padded with 0.",
    },
    {
        n: "2",
        title: "MinMax Normalization",
        detail: "Scale every feature to [0, 1] using the scaler fitted during training (persisted in detector_config.pkl).",
    },
    {
        n: "3",
        title: "Autoencoder Inference",
        detail: "Encode the record to a compressed bottleneck representation, then decode it back to original dimensions.",
    },
    {
        n: "4",
        title: "Reconstruction Error (MSE)",
        detail: "Compute mean squared error between the original scaled input and the decoded output for each row.",
    },
    {
        n: "5",
        title: "Threshold Classification",
        detail: "MSE above the 95th-percentile threshold → MALICIOUS. At or below → NORMAL.",
    },
];

const CLEANING_STEPS = [
    "Missing values filled with 0",
    "Non-numeric columns ignored",
    "Columns absent from the model feature set padded with 0",
    "Infinite / NaN values coerced to 0 before scaling",
];

const NORMALIZATION_STEPS = [
    "MinMaxScaler fitted on full training data (5.4 M rows)",
    "Scales each feature independently to [0, 1]",
    "Scaler parameters saved in Models/detector_config.pkl",
    "Same scaler applied at inference — no re-fitting on user data",
];

export default function Preprocessing() {
    const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
    const [loading, setLoading]     = useState(true);
    const [backendUp, setBackendUp] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE}/api/info`)
            .then((r) => r.json())
            .then((data) => {
                setModelInfo(data);
                setBackendUp(true);
                setLoading(false);
            })
            .catch(() => {
                setBackendUp(false);
                setLoading(false);
            });
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                heading="Preprocessing & Feature Engineering"
                description="Steps the backend applies automatically before running the autoencoder."
            />

            {/* backend status banner */}
            <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm border ${
                    loading
                        ? "bg-muted/40 border-border text-muted-foreground"
                        : backendUp
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}
            >
                {loading ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Connecting to analysis server…
                    </>
                ) : backendUp ? (
                    <>
                        <CheckCircle className="h-4 w-4" />
                        Backend online — model loaded with {modelInfo?.feature_cols.length} features
                    </>
                ) : (
                    <>
                        <AlertCircle className="h-4 w-4" />
                        Backend offline. Start it with:{" "}
                        <code className="ml-1 font-mono bg-destructive/10 px-1 rounded">
                            uvicorn backend.main:app --reload --port 8000
                        </code>
                    </>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* data cleaning */}
                <Card>
                    <CardHeader>
                        <CardTitle>Data Cleaning</CardTitle>
                        <CardDescription>Applied automatically before inference.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {CLEANING_STEPS.map((step) => (
                            <div key={step} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span>{step}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* normalization */}
                <Card>
                    <CardHeader>
                        <CardTitle>Normalization</CardTitle>
                        <CardDescription>Scaling strategy used by the trained model.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {NORMALIZATION_STEPS.map((step) => (
                            <div key={step} className="flex items-start gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span>{step}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* live feature list */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Model Feature Set</CardTitle>
                        <CardDescription>
                            {loading
                                ? "Loading from backend…"
                                : backendUp
                                ? `${modelInfo?.feature_cols.length} features expected by the autoencoder (live from backend)`
                                : "Start the backend to see the live feature list"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Fetching model info…
                            </div>
                        ) : !backendUp ? (
                            <p className="text-sm text-muted-foreground">
                                Feature list will appear once the backend is running.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {modelInfo?.feature_cols.map((col) => (
                                        <Badge key={col} variant="secondary" className="font-mono text-xs">
                                            {col}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="pt-3 border-t space-y-2 text-sm">
                                    <p className="text-muted-foreground text-xs">
                                        Base threshold (99th percentile of normal-traffic MSE across all training devices)
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {modelInfo?.sensitivity_thresholds &&
                                            Object.entries(modelInfo.sensitivity_thresholds).map(([level, t]) => (
                                                <div
                                                    key={level}
                                                    className="flex flex-col items-center p-2 rounded-md bg-muted/50"
                                                >
                                                    <span className="text-xs capitalize text-muted-foreground">
                                                        {level} sensitivity
                                                    </span>
                                                    <code className="font-mono font-semibold text-sm mt-0.5">
                                                        {Number(t).toFixed(6)}
                                                    </code>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* pipeline steps */}
            <Card>
                <CardHeader>
                    <CardTitle>Detection Pipeline</CardTitle>
                    <CardDescription>
                        End-to-end flow from raw CSV to NORMAL / MALICIOUS label.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ol className="space-y-4">
                        {PIPELINE_STEPS.map((step) => (
                            <li key={step.n} className="flex gap-3 text-sm">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                    {step.n}
                                </span>
                                <div>
                                    <span className="font-semibold">{step.title}: </span>
                                    <span className="text-muted-foreground">{step.detail}</span>
                                </div>
                            </li>
                        ))}
                    </ol>
                </CardContent>
            </Card>
        </div>
    );
}
