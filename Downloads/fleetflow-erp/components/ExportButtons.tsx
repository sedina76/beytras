"use client";
import { useState } from "react";
import { FileJson, Sheet, RefreshCw, CheckCircle2 } from "lucide-react";

export default function ExportButtons() {
  const [dlJson, setDlJson] = useState(false);
  const [dlExcel, setDlExcel] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);

  async function download(url: string, filename: string, setLoading: (v: boolean) => void) {
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        let msg = `Export failed (${res.status})`;
        try {
          const body = await res.json();
          if (body?.error) msg += `: ${body.error}`;
        } catch { /* body wasn't JSON */ }
        alert(msg);
        return;
      }
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
      setLastExport(new Date().toISOString());
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  const date = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => download("/api/export/excel", `fleetflow-export-${date}.xlsx`, setDlExcel)}
          disabled={dlExcel}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: dlExcel ? "default" : "pointer", fontSize: 13, fontWeight: 700, opacity: dlExcel ? 0.7 : 1 }}
        >
          {dlExcel
            ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
            : <Sheet size={14} />}
          {dlExcel ? "Preparing…" : "Download Excel (.xlsx)"}
        </button>

        <button
          onClick={() => download("/api/export/json", `fleetflow-backup-${date}.json`, setDlJson)}
          disabled={dlJson}
          style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "none", color: "var(--text-primary)", border: "1px solid var(--border)", borderRadius: 8, cursor: dlJson ? "default" : "pointer", fontSize: 13, fontWeight: 600, opacity: dlJson ? 0.7 : 1 }}
        >
          {dlJson
            ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} />
            : <FileJson size={14} />}
          {dlJson ? "Preparing…" : "Download JSON"}
        </button>
      </div>

      {lastExport && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: "#16a34a" }}>
          <CheckCircle2 size={13} />
          Exported at {new Date(lastExport).toLocaleTimeString("en-KE")}
        </div>
      )}

      <p style={{ fontSize: 11.5, color: "var(--text-muted)", margin: "10px 0 0", lineHeight: 1.6 }}>
        Excel export includes 15 sheets: Customers, Orders, Drivers, Vehicles, Dispatch Jobs, Invoices,
        Payments, Fuel Records, Maintenance, Inventory, Expenses, Pay Rates, Payroll Runs, Payroll Lines, Staff.
      </p>
    </div>
  );
}
