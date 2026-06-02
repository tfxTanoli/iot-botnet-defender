import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    ShieldCheck,
    AlertTriangle,
    Network,
    Cpu,
    Search,
    ClipboardList,
    Lock,
    ArrowLeft,
    UploadCloud,
    CheckSquare,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Severity = "CLEAN" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type Urgency  = "immediate" | "short_term" | "routine";
type Category = "Network" | "Device" | "Forensic" | "Process" | "Prevention";

type Recommendation = {
    id:          string;
    priority:    number;
    category:    Category;
    urgency:     Urgency;
    title:       string;
    description: string;
    steps:       string[];
};

type ThreatIndicator = {
    label:   string;
    value:   string;
    level:   "critical" | "high" | "medium" | "low" | "info";
    detail?: string;
};

type BotnetProfile = {
    profile:         string;
    detail:          string;
    avg_mse_ratio:   number;
    ip_distribution: number;
    unique_ips:      number;
};

type RecommendationData = {
    severity:             Severity;
    severity_description: string;
    malicious_pct:        number;
    affected_ips:         string[];
    avg_mse_ratio:        number;
    avg_confidence:       number;
    botnet_profile:       BotnetProfile | null;
    threat_indicators:    ThreatIndicator[];
    recommendations:      Recommendation[];
};

type PageState = {
    filename:            string;
    total:               number;
    malicious:           number;
    normal:              number;
    threshold:           number;
    sensitivity:         string;
    recommendation_data: RecommendationData;
};

// ── Style maps ───────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<Severity, {
    bg: string; border: string; text: string; icon: React.ComponentType<{ className?: string }>;
}> = {
    CLEAN:    { bg: "bg-emerald-500/10",  border: "border-emerald-500/30",  text: "text-emerald-600 dark:text-emerald-400",  icon: ShieldCheck  },
    LOW:      { bg: "bg-blue-500/10",     border: "border-blue-500/30",     text: "text-blue-600 dark:text-blue-400",        icon: ShieldCheck  },
    MEDIUM:   { bg: "bg-amber-500/10",    border: "border-amber-500/30",    text: "text-amber-600 dark:text-amber-400",      icon: AlertTriangle },
    HIGH:     { bg: "bg-orange-500/10",   border: "border-orange-500/30",   text: "text-orange-600 dark:text-orange-400",   icon: ShieldAlert  },
    CRITICAL: { bg: "bg-destructive/10",  border: "border-destructive/30",  text: "text-destructive",                       icon: ShieldAlert  },
};

const INDICATOR_LEVEL_STYLES: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/20",
    high:     "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    medium:   "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    low:      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    info:     "bg-muted text-muted-foreground border-border",
};

const URGENCY_STYLES: Record<Urgency, { label: string; style: string }> = {
    immediate:  { label: "Immediate",  style: "bg-destructive/10 text-destructive border-destructive/20" },
    short_term: { label: "Short-term", style: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    routine:    { label: "Routine",    style: "bg-muted text-muted-foreground border-border" },
};

const CATEGORY_ICONS: Record<Category, React.ComponentType<{ className?: string }>> = {
    Network:    Network,
    Device:     Cpu,
    Forensic:   Search,
    Process:    ClipboardList,
    Prevention: Lock,
};

const CATEGORY_STYLES: Record<Category, string> = {
    Network:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    Device:     "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    Forensic:   "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    Process:    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    Prevention: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
    const [expanded, setExpanded] = useState(rec.urgency === "immediate");
    const [checked, setChecked]   = useState<Set<number>>(new Set());

    const CategoryIcon = CATEGORY_ICONS[rec.category];

    const toggleCheck = (i: number) => {
        setChecked((prev) => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    return (
        <Card className={`border ${rec.urgency === "immediate" ? "border-destructive/30" : "border-border"}`}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">
                            P{rec.priority}
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold leading-tight">{rec.title}</p>
                            <p className="text-sm text-muted-foreground mt-1 leading-snug">
                                {rec.description}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge
                            variant="outline"
                            className={`text-xs ${URGENCY_STYLES[rec.urgency].style}`}
                        >
                            {URGENCY_STYLES[rec.urgency].label}
                        </Badge>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${CATEGORY_STYLES[rec.category]}`}>
                            <CategoryIcon className="h-3 w-3" />
                            {rec.category}
                        </span>
                    </div>
                </div>
            </CardHeader>

            {rec.steps.length > 0 && (
                <CardContent className="pt-0">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground mb-2 -ml-2"
                        onClick={() => setExpanded((v) => !v)}
                    >
                        {expanded ? (
                            <><ChevronUp className="h-3.5 w-3.5 mr-1" /> Hide steps</>
                        ) : (
                            <><ChevronDown className="h-3.5 w-3.5 mr-1" /> Show {rec.steps.length} steps</>
                        )}
                    </Button>

                    {expanded && (
                        <ol className="space-y-2">
                            {rec.steps.map((step, i) => (
                                <li
                                    key={i}
                                    className={`flex items-start gap-2.5 text-sm cursor-pointer group rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 ${checked.has(i) ? "opacity-50" : ""}`}
                                    onClick={() => toggleCheck(i)}
                                >
                                    <CheckSquare
                                        className={`h-4 w-4 mt-0.5 shrink-0 transition-colors ${
                                            checked.has(i)
                                                ? "text-emerald-500"
                                                : "text-muted-foreground group-hover:text-foreground"
                                        }`}
                                    />
                                    <span className={checked.has(i) ? "line-through" : ""}>{step}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function Recommendations() {
    const location = useLocation();
    const navigate = useNavigate();
    const state    = location.state as PageState | null;

    if (!state?.recommendation_data) {
        return (
            <div className="flex flex-col gap-6">
                <PageHeader
                    heading="Security Recommendations"
                    description="Actionable remediation steps based on your latest analysis."
                />
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground text-sm">
                            No analysis data available. Upload a dataset first to generate recommendations.
                        </p>
                        <Button onClick={() => navigate("/dashboard/upload")}>
                            <UploadCloud className="mr-2 h-4 w-4" />
                            Upload Dataset
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { filename, total, malicious, normal, sensitivity, recommendation_data: rd } = state;
    const { severity, severity_description, threat_indicators, recommendations, affected_ips, botnet_profile } = rd;
    const SeverityIcon = SEVERITY_STYLES[severity].icon;

    // Group recommendations: immediate first, then short_term, then routine
    const grouped: Record<Urgency, Recommendation[]> = {
        immediate:  recommendations.filter((r) => r.urgency === "immediate"),
        short_term: recommendations.filter((r) => r.urgency === "short_term"),
        routine:    recommendations.filter((r) => r.urgency === "routine"),
    };

    const urgencyLabels: Record<Urgency, string> = {
        immediate:  "Immediate Actions",
        short_term: "Short-term Remediation",
        routine:    "Ongoing Prevention",
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    heading="Security Recommendations"
                    description={`Analysis of ${filename} — ${total.toLocaleString()} records`}
                />
                <div className="flex gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/results")}>
                        View Results
                    </Button>
                </div>
            </div>

            {/* ── Severity banner ── */}
            <Card className={`border ${SEVERITY_STYLES[severity].border} ${SEVERITY_STYLES[severity].bg}`}>
                <CardContent className="py-5 px-6">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <SeverityIcon className={`h-8 w-8 ${SEVERITY_STYLES[severity].text}`} />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl font-bold ${SEVERITY_STYLES[severity].text}`}>
                                        {severity}
                                    </span>
                                    <Badge variant="outline" className={`${SEVERITY_STYLES[severity].text} border-current text-xs`}>
                                        {rd.malicious_pct.toFixed(1)}% malicious
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{severity_description}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <span><strong className="text-foreground">{total.toLocaleString()}</strong> total</span>
                            <span><strong className="text-destructive">{malicious.toLocaleString()}</strong> malicious</span>
                            <span><strong className="text-emerald-500">{normal.toLocaleString()}</strong> normal</span>
                            <span>Sensitivity: <strong className="text-foreground capitalize">{sensitivity}</strong></span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Threat indicators ── */}
            {threat_indicators.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Threat Indicators
                    </h3>
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                        {threat_indicators.map((ind) => (
                            <div
                                key={ind.label}
                                className={`rounded-lg border p-3 ${INDICATOR_LEVEL_STYLES[ind.level]}`}
                                title={ind.detail}
                            >
                                <p className="text-xs font-medium opacity-70 mb-0.5">{ind.label}</p>
                                <p className="text-lg font-bold leading-tight">{ind.value}</p>
                                {ind.detail && (
                                    <p className="text-xs opacity-60 mt-1 leading-tight">{ind.detail}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Botnet profile + Affected IPs ── */}
            {(botnet_profile || affected_ips.length > 0) && (
                <div className="grid gap-4 md:grid-cols-2">
                    {botnet_profile && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">Botnet Profile Analysis</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Detected Profile</span>
                                    <Badge variant="outline">{botnet_profile.profile}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Anomaly Intensity</span>
                                    <span className="font-medium">{botnet_profile.avg_mse_ratio}× threshold</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">IP Distribution</span>
                                    <span className="font-medium">{(botnet_profile.ip_distribution * 100).toFixed(0)}% unique</span>
                                </div>
                                <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                                    {botnet_profile.detail}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {affected_ips.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">
                                    Affected IP Addresses ({affected_ips.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {affected_ips.map((ip) => (
                                        <div key={ip} className="font-mono text-xs bg-muted/50 rounded px-2 py-1">
                                            {ip}
                                        </div>
                                    ))}
                                </div>
                                {affected_ips.length === 50 && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Showing top 50 affected IPs. View all in Detection Results.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* ── Recommendations grouped by urgency ── */}
            {recommendations.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                        <ShieldCheck className="h-10 w-10 text-emerald-500" />
                        <p className="text-muted-foreground text-sm">No action required. Traffic is clean.</p>
                    </CardContent>
                </Card>
            ) : (
                (["immediate", "short_term", "routine"] as Urgency[]).map((urgency) => {
                    const group = grouped[urgency];
                    if (group.length === 0) return null;
                    return (
                        <div key={urgency}>
                            <div className="flex items-center gap-2 mb-3">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    {urgencyLabels[urgency]}
                                </h3>
                                <div className="flex-1 h-px bg-border" />
                                <span className="text-xs text-muted-foreground">{group.length} action{group.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="space-y-3">
                                {group.map((rec) => (
                                    <RecommendationCard key={rec.id} rec={rec} />
                                ))}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
