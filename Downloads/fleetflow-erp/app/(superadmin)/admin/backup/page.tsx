"use client";
import { useState, useRef } from "react";
import { Download, Upload, ShieldCheck, Database, AlertTriangle, CheckCircle2, RefreshCw, FileJson, Sheet } from "lucide-react";

type RestoreResult = {
  ok: boolean;
  restoredAt: string;
  backupDate: string;
  results: Record<string, number>;
  error?: string;
};

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [lastDownload, setLastDownload] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);
  const [restoreError, setRestoreError] = useState("");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function triggerDownload(url: string, filename: string) {
    const res = await fetch(url);
    if (!res.ok) { alert("Export failed"); return; }
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objUrl);
    setLastDownload(new Date().toISOString());
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      await triggerDownload("/api/admin/backup", `fleetflow-backup-${date}.json`);
    } finally {
      setDownloading(false);
    }
  }

  async function handleExcelDownload() {
    setDownloadingExcel(true);
    try {
      const date = new Date().toISOString().slice(0, 10);
      await triggerDownload("/api/admin/backup/excel", `fleetflow-backup-${date}.xlsx`);
    } finally {
      setDownloadingExcel(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      setRestoreError("Please select a .json backup file");
      return;
    }
    setPendingFile(file);
    setConfirmRestore(true);
    setRestoreError("");
    setRestoreResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleRestore() {
    if (!pendingFile) return;
    setRestoring(true);
    setRestoreError("");
    setConfirmRestore(false);
    try {
      const text = await pendingFile.text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { setRestoreError("Invalid JSON — the file may be corrupted"); return; }

      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data: RestoreResult = await res.json();
      if (!res.ok) { setRestoreError(data.error ?? "Restore failed"); return; }
      setRestoreResult(data);
    } catch (e) {
      setRestoreError(e instanceof Error ? e.message : "Restore failed");
    } finally {
      setRestoring(false);
      setPendingFile(null);
    }
  }

  return (
    <div className="slide-in" style={{ maxWidth: 780 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#fff" }}>Backup &amp; Restore</h1>
        <p style={{ color: "#94a3b8", fontSize: 12.5, margin: "4px 0 0" }}>
          Export a full JSON snapshot of all data, or restore from a previous backup.
        </p>
      </div>

      {/* Backup card */}
      <div style={{ background: "#0f1f35", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Database size={20} color="#60a5fa" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Download Backup</h2>
            <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "4px 0 0", lineHeight: 1.5 }}>
              <strong style={{ color: "#e2e8f0" }}>JSON</strong> — complete snapshot for restore operations. &nbsp;
              <strong style={{ color: "#86efac" }}>Excel</strong> — 17 sheets, one per table, ready for reporting in Excel or Google Sheets.
              Store in Google Drive, Dropbox, or an external drive.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: downloading ? 0.7 : 1 }}
          >
            {downloading ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <FileJson size={14} />}
            {downloading ? "Preparing…" : "Download JSON"}
          </button>

          <button
            onClick={handleExcelDownload}
            disabled={downloadingExcel}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: downloadingExcel ? 0.7 : 1 }}
          >
            {downloadingExcel ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Sheet size={14} />}
            {downloadingExcel ? "Preparing…" : "Download Excel"}
          </button>

          {lastDownload && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4ade80" }}>
              <CheckCircle2 size={13} />
              Last: {new Date(lastDownload).toLocaleString("en-KE")}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: "#94a3b8" }}>What's included:</strong>{" "}
            Organizations · Users · Customers · Orders · Drivers · Vehicles · Dispatch Jobs · Invoices · Payments ·
            Fuel Records · Maintenance · Inventory · Payroll Runs · Pay Rates · Audit Logs
          </p>
        </div>
      </div>

      {/* Restore card */}
      <div style={{ background: "#0f1f35", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Upload size={20} color="#f87171" />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Restore from Backup</h2>
            <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "4px 0 0", lineHeight: 1.5 }}>
              Upserts all records from a backup file. Existing records are overwritten. New records are created.
              <strong style={{ color: "#fca5a5" }}> Does not delete records not present in the backup.</strong>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFileSelect} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={restoring}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "rgba(220,38,38,0.15)", color: "#f87171", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: restoring ? 0.7 : 1 }}
          >
            {restoring ? <RefreshCw size={14} style={{ animation: "spin 0.8s linear infinite" }} /> : <Upload size={14} />}
            {restoring ? "Restoring…" : "Select Backup File"}
          </button>
          <span style={{ fontSize: 12, color: "#475569" }}>Accepts .json files exported from this system</span>
        </div>

        {restoreError && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <AlertTriangle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12.5, color: "#f87171", margin: 0 }}>{restoreError}</p>
          </div>
        )}

        {restoreResult && (
          <div style={{ marginTop: 12, padding: "14px", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", borderRadius: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <CheckCircle2 size={15} color="#4ade80" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4ade80" }}>Restore complete</span>
              <span style={{ fontSize: 11.5, color: "#64748b" }}>
                (backup from {new Date(restoreResult.backupDate).toLocaleString("en-KE")})
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 6 }}>
              {Object.entries(restoreResult.results).map(([table, count]) => (
                <div key={table} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#94a3b8", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "4px 8px" }}>
                  <span style={{ textTransform: "capitalize" }}>{table.replace(/([A-Z])/g, " $1")}</span>
                  <span style={{ fontWeight: 700, color: "#fff" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Automated backup guide */}
      <div style={{ background: "#0f1f35", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <ShieldCheck size={17} color="#a78bfa" />
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#fff", margin: 0 }}>Automated Backup (Recommended)</h2>
        </div>
        <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "0 0 14px", lineHeight: 1.6 }}>
          Run this shell script on a cron schedule to automatically download and store daily backups.
        </p>
        <pre style={{ background: "#050e1a", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: 16, fontSize: 11.5, color: "#a5f3fc", overflowX: "auto", margin: "0 0 12px", lineHeight: 1.7, whiteSpace: "pre" }}>{`#!/bin/bash
# Save as: backup.sh — run daily via cron

APP_URL="https://your-domain.com"
SESSION_COOKIE="ff-session=your-session-token"
BACKUP_DIR="$HOME/fleetflow-backups"
DATE=$(date +%Y-%m-%d)

mkdir -p "$BACKUP_DIR"
curl -s -H "Cookie: $SESSION_COOKIE" \\
  "$APP_URL/api/admin/backup" \\
  -o "$BACKUP_DIR/fleetflow-$DATE.json"

# Keep last 30 backups, delete older ones
find "$BACKUP_DIR" -name "*.json" -mtime +30 -delete
echo "Backup saved: $BACKUP_DIR/fleetflow-$DATE.json"`}</pre>

        <div style={{ padding: "10px 14px", background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.15)", borderRadius: 8 }}>
          <p style={{ fontSize: 11.5, color: "#a78bfa", margin: "0 0 6px", fontWeight: 700 }}>Add to crontab (runs daily at 2 AM):</p>
          <code style={{ fontSize: 11.5, color: "#e2e8f0", background: "rgba(0,0,0,0.3)", padding: "3px 8px", borderRadius: 4, display: "block" }}>
            0 2 * * * /path/to/backup.sh &gt;&gt; /var/log/fleetflow-backup.log 2&gt;&amp;1
          </code>
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "flex-start", gap: 8 }}>
          <FileJson size={14} color="#64748b" style={{ marginTop: 1, flexShrink: 0 }} />
          <p style={{ fontSize: 11.5, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            For cloud storage, pipe the output directly to <strong style={{ color: "#94a3b8" }}>AWS S3</strong> (<code style={{ color: "#a5f3fc" }}>aws s3 cp</code>),{" "}
            <strong style={{ color: "#94a3b8" }}>Google Cloud Storage</strong> (<code style={{ color: "#a5f3fc" }}>gsutil cp</code>),
            or any other storage provider.
          </p>
        </div>
      </div>

      {/* Confirm restore modal */}
      {confirmRestore && pendingFile && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0f1f35", border: "1px solid rgba(220,38,38,0.3)", borderRadius: 14, width: "100%", maxWidth: 420, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
              <AlertTriangle size={20} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>Confirm Restore</h3>
                <p style={{ fontSize: 12.5, color: "#94a3b8", margin: "6px 0 0", lineHeight: 1.5 }}>
                  You are about to restore from <strong style={{ color: "#e2e8f0" }}>{pendingFile.name}</strong>.
                  This will overwrite existing records with backup data. This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => { setConfirmRestore(false); setPendingFile(null); }}
                style={{ padding: "8px 16px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, cursor: "pointer", color: "#94a3b8", fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleRestore}
                style={{ padding: "8px 18px", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700 }}
              >
                Yes, Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
