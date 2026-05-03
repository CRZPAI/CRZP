import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type RiskScoreResponse } from "@shared/schema";

interface Props { data: RiskScoreResponse }

export function ThreatBriefing({ data }: Props) {
  const [loading, setLoading] = useState(false);

  const generate = () => {
    setLoading(true);

    const scoreColor =
      data.riskScore >= 75 ? "#ef4444"
      : data.riskScore >= 50 ? "#f97316"
      : data.riskScore >= 25 ? "#f59e0b"
      : "#22c55e";

    const ts = data.lastUpdated
      ? new Date(data.lastUpdated).toUTCString()
      : new Date().toUTCString();
    const sources = (data.dataSourcesUsed ?? ["GDELT", "ReliefWeb"]).join(" · ");

    const breakdownRows = data.breakdown
      ? Object.entries(data.breakdown).map(([k, v]) => {
          const barColor =
            v >= 75 ? "#ef4444" : v >= 50 ? "#f97316" : v >= 25 ? "#f59e0b" : "#22c55e";
          return `
            <tr>
              <td style="padding:3px 8px 3px 0;color:#b4bece;font-size:11px;white-space:nowrap">
                ${k.charAt(0).toUpperCase() + k.slice(1)}
              </td>
              <td style="padding:3px 0;width:100%">
                <div style="background:#1e2840;border-radius:3px;height:6px">
                  <div style="background:${barColor};border-radius:3px;height:6px;width:${v}%"></div>
                </div>
              </td>
              <td style="padding:3px 0 3px 8px;color:#b4bece;font-size:11px;font-weight:bold">
                ${v}
              </td>
            </tr>`;
        }).join("")
      : "";

    const factorsHtml = data.factors.length > 0
      ? data.factors.map(f => `<li style="margin-bottom:4px;color:#b4bece;font-size:11px">${f}</li>`).join("")
      : "";

    const newsHtml = (data.news ?? []).slice(0, 6).map(art => {
      const sentColor = art.sentiment === "negative" ? "#ef4444" : art.sentiment === "positive" ? "#22c55e" : "#94a3b8";
      return `
        <div style="margin-bottom:10px;border-left:3px solid ${sentColor};padding-left:10px">
          <div style="font-size:11px;color:#c8d4e6;font-weight:600;margin-bottom:2px">${art.title}</div>
          <div style="font-size:10px;color:#607080">${art.source} · ${art.date} · <span style="color:${sentColor}">${art.sentiment.toUpperCase()}</span></div>
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Crisis Risk Briefing — ${data.location}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0f1e; font-family: Helvetica, Arial, sans-serif; color: #dce1eb; padding: 32px; }
    .header { background: #141e37; border-radius: 8px; padding: 20px 24px; margin-bottom: 24px; }
    .header h1 { color: #60a5fa; font-size: 20px; letter-spacing: 2px; margin-bottom: 6px; }
    .header .meta { color: #788aa8; font-size: 10px; }
    .score-block { display: flex; align-items: baseline; gap: 12px; margin: 16px 0; }
    .score-num { font-size: 52px; font-weight: bold; line-height: 1; color: ${scoreColor}; }
    .score-label { font-size: 16px; color: ${scoreColor}; font-weight: 600; }
    .section-title { color: #60a5fa; font-size: 10px; font-weight: bold; letter-spacing: 1.5px; margin-bottom: 10px; text-transform: uppercase; }
    .divider { border: none; border-top: 1px solid #32405a; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    ul { padding-left: 16px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #1e2840; color: #4a6070; font-size: 9px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CRISIS RISK BRIEFING</h1>
    <div class="meta">Generated: ${ts}</div>
    <div class="meta">Sources: ${sources}</div>
  </div>

  <div style="font-size:20px;font-weight:bold;color:#e6ebf5;letter-spacing:1px">${data.location.toUpperCase()}</div>
  <div class="score-block">
    <div class="score-num">${data.riskScore}</div>
    <div class="score-label">/ 100 — ${data.riskLevel.toUpperCase()}</div>
  </div>

  ${data.breakdown ? `
  <hr class="divider"/>
  <div class="section-title">Risk Dimensions</div>
  <table>${breakdownRows}</table>
  ` : ""}

  ${data.factors.length > 0 ? `
  <hr class="divider"/>
  <div class="section-title">Key Risk Factors</div>
  <ul>${factorsHtml}</ul>
  ` : ""}

  ${(data.news ?? []).length > 0 ? `
  <hr class="divider"/>
  <div class="section-title">Recent Intelligence</div>
  ${newsHtml}
  ` : ""}

  <div class="footer">Crisis Risk Predictor · ML-powered geopolitical intelligence · For informational purposes only</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        setLoading(false);
      }, 300);
    } else {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm" variant="outline"
      className="h-8 text-xs gap-2"
      onClick={generate}
      disabled={loading}
      data-testid="button-export-brief"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
      Export Brief
    </Button>
  );
}
