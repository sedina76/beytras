"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";

const TYPES = ["service", "repair", "inspection", "tire", "battery", "other"];

export default function NewMaintenancePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<{ id: string; plateNumber: string; make: string; model: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/vehicles").then(r => r.ok ? r.json() : []).then((d: unknown) => setVehicles(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      vehicleId: fd.get("vehicleId"),
      type: fd.get("type"),
      description: fd.get("description"),
      odometerKm: parseFloat(String(fd.get("odometerKm") ?? "0")),
      cost: parseFloat(String(fd.get("cost") ?? "0")),
      vendor: fd.get("vendor") || null,
      mechanicNotes: fd.get("mechanicNotes") || null,
      nextServiceKm: fd.get("nextServiceKm") ? parseFloat(String(fd.get("nextServiceKm"))) : null,
      nextServiceDate: fd.get("nextServiceDate") || null,
      status: fd.get("status"),
      date: fd.get("date"),
    };

    const res = await fetch("/api/maintenance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      router.push("/maintenance");
    } else {
      const d = await res.json();
      setError(d.error ?? "Failed to save");
      setSubmitting(false);
    }
  }

  return (
    <div className="slide-in" style={{ maxWidth: 700 }}>
      <Link href="/maintenance" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-muted)", textDecoration: "none", marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back to Maintenance
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wrench size={20} color="#d97706" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Log Maintenance</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: 0 }}>Record a maintenance or repair event</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ff-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Vehicle *</label>
            <select name="vehicleId" required className="ff-input">
              <option value="">Select vehicle</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plateNumber} — {v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Type *</label>
            <select name="type" required className="ff-input">
              {TYPES.map(t => <option key={t} value={t} style={{ textTransform: "capitalize" }}>{t}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Description *</label>
            <textarea name="description" required className="ff-input" rows={2} placeholder="Describe the maintenance work performed…" />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Date *</label>
            <input name="date" type="date" required className="ff-input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Odometer (km) *</label>
            <input name="odometerKm" type="number" step="0.1" required className="ff-input" placeholder="e.g. 45000" />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Cost (KES) *</label>
            <input name="cost" type="number" step="1" required className="ff-input" placeholder="e.g. 15000" />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Status</label>
            <select name="status" className="ff-input">
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Vendor / Garage</label>
            <input name="vendor" className="ff-input" placeholder="e.g. Quick Fix Auto" />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Next Service at (km)</label>
            <input name="nextServiceKm" type="number" className="ff-input" placeholder="e.g. 50000" />
          </div>
          <div>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Next Service Date</label>
            <input name="nextServiceDate" type="date" className="ff-input" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, display: "block", marginBottom: 5 }}>Mechanic Notes</label>
            <textarea name="mechanicNotes" className="ff-input" rows={2} placeholder="Internal notes from mechanic…" />
          </div>
        </div>

        {error && <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Link href="/maintenance" className="ff-btn ff-btn-secondary">Cancel</Link>
          <button type="submit" disabled={submitting} className="ff-btn ff-btn-primary">
            {submitting ? "Saving…" : "Save Record"}
          </button>
        </div>
      </form>
    </div>
  );
}
