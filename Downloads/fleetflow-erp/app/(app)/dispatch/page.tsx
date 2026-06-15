"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Radio, Truck, UserCheck, AlertCircle, CheckCircle2, MapPin, Phone,
  Package, RefreshCw, X, Map, Calendar, ClipboardList, Droplets,
} from "lucide-react";
import type { MapMarker } from "@/components/LiveMap";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 420, borderRadius: 10, background: "#e8f4f8", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
      Loading map…
    </div>
  ),
});

type Driver = { id: string; name: string; phone: string; status: string; locations: { lat: number; lng: number; createdAt: string }[] };
type Vehicle = { id: string; plateNumber: string; make: string; model: string; capacityLitres: number; status: string };
type Conductor = { id: string; name: string; phone: string };
type WaterSource = { id: string; name: string; address: string };
type Job = {
  id: string; status: string; priority: boolean; assignedAt: string | null; completedAt: string | null;
  order: {
    id: string; orderNumber: string; quantityOrdered: number; unit: string; productType: string;
    scheduledAt: string | null; createdAt: string; deliveryAddress: string;
    priority: string; totalAmount: number; status: string;
    deliveryLat?: number; deliveryLng?: number;
    customer: { name: string; phone: string; address: string };
  };
  driver: { name: string; phone: string; status: string; locations: { lat: number; lng: number; createdAt: string }[] } | null;
  vehicle: { plateNumber: string; make: string; model: string; capacityLitres: number } | null;
  conductor: { name: string; phone: string } | null;
  waterSource: { name: string; address: string } | null;
};
type MapData = {
  driverMarkers: (MapMarker & { jobStatus: string; orderId: string; orderNumber: string; updatedAt: string })[];
  orderMarkers: MapMarker[];
  pickupMarkers: MapMarker[];
  stats: { activeDrivers: number; driversWithGPS: number; driversWithoutGPS: number };
};

const STATUS_COLOR: Record<string, string> = {
  unassigned: "ff-badge-yellow", assigned: "ff-badge-blue", accepted: "ff-badge-blue",
  en_route_source: "ff-badge-purple", loading: "ff-badge-orange",
  en_route_customer: "ff-badge-purple", arrived: "ff-badge-green",
  delivered: "ff-badge-green", cancelled: "ff-badge-red", failed: "ff-badge-red",
};
const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: "ff-badge-yellow", confirmed: "ff-badge-blue", dispatched: "ff-badge-purple",
  in_progress: "ff-badge-orange", delivered: "ff-badge-green", cancelled: "ff-badge-red",
};
const PRIORITY_COLOR: Record<string, string> = {
  low: "ff-badge-gray", normal: "ff-badge-blue", high: "ff-badge-orange", urgent: "ff-badge-red",
};
const PRIORITY_BORDER: Record<string, string> = {
  urgent: "#dc2626", high: "#d97706", normal: "#2563eb", low: "#94a3b8",
};

export default function DispatchPage() {
  const [data, setData] = useState<{
    jobs: Job[];
    availableDrivers: Driver[];
    availableVehicles: Vehicle[];
    availableConductors: Conductor[];
    waterSources: WaterSource[];
  } | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [syncInfo, setSyncInfo] = useState<{ pendingOrders: number; dispatchRecords: number; unassignedDispatch: number; missingCount: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<{ job: Job } | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedConductor, setSelectedConductor] = useState("");
  const [selectedWaterSource, setSelectedWaterSource] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [tab, setTab] = useState<"unassigned" | "assigned" | "in_progress" | "completed">("unassigned");
  const [showMap, setShowMap] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    const [dispRes, mapRes, syncRes] = await Promise.all([
      fetch("/api/dispatch"),
      fetch("/api/map"),
      fetch("/api/dispatch/sync"),
    ]);
    if (dispRes.ok) setData(await dispRes.json());
    if (mapRes.ok) setMapData(await mapRes.json());
    if (syncRes.ok) setSyncInfo(await syncRes.json());
    setLoading(false);
    setLastRefreshed(new Date());
    if (manual) setRefreshing(false);
  }, []);

  async function runSync() {
    setSyncing(true);
    await fetch("/api/dispatch/sync", { method: "POST" });
    await fetchData(true);
    setSyncing(false);
  }

  useEffect(() => {
    fetchData(false);
    const t = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(t);
  }, [fetchData]);

  const allMarkers = useMemo<MapMarker[]>(() => {
    if (!mapData) return [];
    return [...mapData.driverMarkers, ...mapData.orderMarkers, ...mapData.pickupMarkers];
  }, [mapData]);

  const unassignedJobs = (data?.jobs ?? []).filter(j =>
    j.status === "unassigned" && ["pending", "confirmed"].includes(j.order.status)
  );
  const assignedJobs = (data?.jobs ?? []).filter(j => ["assigned", "accepted"].includes(j.status));
  const inProgressJobs = (data?.jobs ?? []).filter(j =>
    ["en_route_source", "loading", "en_route_customer", "arrived"].includes(j.status)
  );
  const completedJobs = (data?.jobs ?? []).filter(j => j.status === "delivered");

  async function assignJob() {
    if (!assignModal || !selectedDriver || !selectedVehicle) return;
    setAssigning(true);
    await fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: assignModal.job.id,
        driverId: selectedDriver,
        vehicleId: selectedVehicle,
        conductorId: selectedConductor || null,
        waterSourceId: selectedWaterSource || null,
      }),
    });
    setAssignModal(null);
    setSelectedDriver(""); setSelectedVehicle(""); setSelectedConductor(""); setSelectedWaterSource("");
    setAssigning(false);
    fetchData(true);
  }

  async function updateJobStatus(jobId: string, status: string) {
    await fetch("/api/dispatch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, status }),
    });
    fetchData(false);
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "var(--text-muted)" }}>
      Loading dispatch center…
    </div>
  );

  const tabs = [
    { key: "unassigned",  label: "Unassigned",  count: unassignedJobs.length,               color: "#d97706" },
    { key: "assigned",    label: "Assigned",     count: assignedJobs.length,                  color: "#2563eb" },
    { key: "in_progress", label: "In Progress",  count: inProgressJobs.length,                color: "#7c3aed" },
    { key: "completed",   label: "Completed",    count: completedJobs.length,                 color: "#16a34a" },
  ] as const;

  return (
    <div className="slide-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Dispatch Center</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>
            Auto-refreshes every 30 s
            {lastRefreshed && ` · Last updated ${lastRefreshed.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowMap(m => !m)} className="ff-btn ff-btn-secondary ff-btn-sm">
            <Map size={13} /> {showMap ? "Hide Map" : "Show Map"}
          </button>
          <button
            onClick={() => fetchData(true)} disabled={refreshing}
            className="ff-btn ff-btn-secondary ff-btn-sm"
            style={{ opacity: refreshing ? 0.7 : 1 }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? "spin 0.8s linear infinite" : "none" }} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { icon: AlertCircle,  label: "Unassigned",     value: unassignedJobs.length,              color: "#d97706" },
          { icon: ClipboardList,label: "Assigned",        value: assignedJobs.length,                color: "#2563eb" },
          { icon: Radio,        label: "In Progress",     value: inProgressJobs.length,              color: "#7c3aed" },
          { icon: UserCheck,    label: "Avail. Drivers",  value: data?.availableDrivers.length ?? 0, color: "#16a34a" },
          { icon: CheckCircle2, label: "Completed Today", value: completedJobs.length,               color: "#059669" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="ff-card" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} color={color} />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color }}>{value}</p>
              <p style={{ fontSize: 10.5, color: "var(--text-muted)", margin: 0 }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Diagnostic panel */}
      {syncInfo && (
        <div className="ff-card" style={{ marginBottom: 14, padding: "10px 14px", borderLeft: syncInfo.missingCount > 0 ? "4px solid #d97706" : "4px solid #16a34a", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12.5 }}>
              <span style={{ fontWeight: 700 }}>Orders Pending:</span>{" "}
              <span style={{ color: "#2563eb", fontWeight: 700 }}>{syncInfo.pendingOrders}</span>
            </span>
            <span style={{ fontSize: 12.5 }}>
              <span style={{ fontWeight: 700 }}>Dispatch Records:</span>{" "}
              <span style={{ color: "#7c3aed", fontWeight: 700 }}>{syncInfo.dispatchRecords}</span>
            </span>
            <span style={{ fontSize: 12.5 }}>
              <span style={{ fontWeight: 700 }}>Unassigned Dispatch:</span>{" "}
              <span style={{ color: "#d97706", fontWeight: 700 }}>{syncInfo.unassignedDispatch}</span>
            </span>
            {syncInfo.missingCount > 0 && (
              <span style={{ fontSize: 12.5, color: "#dc2626", fontWeight: 700 }}>
                ⚠ {syncInfo.missingCount} order{syncInfo.missingCount > 1 ? "s" : ""} missing dispatch record
              </span>
            )}
          </div>
          {syncInfo.missingCount > 0 && (
            <button
              onClick={runSync}
              disabled={syncing}
              style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", background: "#d97706", color: "#fff", border: "none", borderRadius: 6, cursor: syncing ? "default" : "pointer", opacity: syncing ? 0.7 : 1 }}
            >
              {syncing ? "Syncing…" : "Sync Missing Records"}
            </button>
          )}
        </div>
      )}

      {/* Live Map */}
      {showMap && (
        <div className="ff-card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} className="pulse-dot" />
              <span style={{ fontWeight: 700, fontSize: 13 }}>Live Fleet Map</span>
              <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                {mapData?.stats.driversWithGPS ?? 0} drivers with GPS · {allMarkers.length} pins
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11.5 }}>
              {[
                { color: "#2563eb", label: "Driver (D)" },
                { color: "#dc2626", label: "Delivery (O)" },
                { color: "#16a34a", label: "Pickup (P)" },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
                  <span style={{ color: "var(--text-muted)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: 12 }}>
            {allMarkers.length === 0 ? (
              <div style={{ height: 300, borderRadius: 10, background: "#f1f5f9", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <MapPin size={32} color="var(--text-muted)" />
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>No active driver GPS positions yet</p>
              </div>
            ) : (
              <LiveMap markers={allMarkers} height={420} />
            )}
          </div>
          {mapData && mapData.stats.driversWithoutGPS > 0 && (
            <div style={{ padding: "8px 14px", borderTop: "1px solid var(--border)", background: "#fffbeb", fontSize: 12, color: "#92400e" }}>
              ⚠ {mapData.stats.driversWithoutGPS} active driver{mapData.stats.driversWithoutGPS > 1 ? "s" : ""} not sharing GPS location
            </div>
          )}
        </div>
      )}

      {/* GPS driver pills */}
      {showMap && mapData && mapData.driverMarkers.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8, marginBottom: 14 }}>
          {mapData.driverMarkers.map((dm, i) => {
            const ageMin = Math.floor((Date.now() - new Date(dm.updatedAt).getTime()) / 60000);
            return (
              <div key={i} className="ff-card" style={{ padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "#2563eb" }}>{dm.label[0]}</span>
                  <div style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{dm.label}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0", textTransform: "capitalize" }}>{dm.sublabel}</p>
                  <p style={{ fontSize: 10.5, color: ageMin < 5 ? "#16a34a" : ageMin < 15 ? "#d97706" : "#dc2626", margin: "2px 0 0" }}>
                    GPS {ageMin < 1 ? "just now" : ageMin + "m ago"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 14 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: "9px 18px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? t.color : "var(--text-muted)",
              borderBottom: tab === t.key ? `2px solid ${t.color}` : "2px solid transparent",
              marginBottom: -1, display: "flex", alignItems: "center", gap: 6,
            }}>
            {t.label}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
              background: tab === t.key ? t.color : "var(--border)",
              color: tab === t.key ? "#fff" : "var(--text-muted)",
            }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── UNASSIGNED ── */}
      {tab === "unassigned" && (
        unassignedJobs.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <CheckCircle2 size={40} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0 }}>No unassigned orders — all clear!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 12 }}>
            {unassignedJobs.map(job => (
              <div key={job.id} className="ff-card"
                style={{ borderLeft: `4px solid ${PRIORITY_BORDER[job.order.priority] ?? "#2563eb"}`, padding: "14px 16px" }}>

                {/* Top row: order number + badges */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "var(--accent)", fontFamily: "monospace" }}>
                      {job.order.orderNumber}
                    </span>
                    <span className={`ff-badge ${PRIORITY_COLOR[job.order.priority] ?? "ff-badge-gray"}`}>{job.order.priority}</span>
                  </div>
                  <span className={`ff-badge ${ORDER_STATUS_COLOR[job.order.status] ?? "ff-badge-gray"}`}>{job.order.status}</span>
                </div>

                {/* Customer */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#2563eb" }}>{job.order.customer.name[0]}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>{job.order.customer.name}</p>
                    {job.order.customer.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-muted)" }}>
                        <Phone size={10} />{job.order.customer.phone}
                      </div>
                    )}
                  </div>
                </div>

                {/* Load details */}
                <div style={{ background: "var(--background)", borderRadius: 8, padding: "8px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <Package size={12} color="var(--text-muted)" />
                  <span style={{ fontSize: 12.5, fontWeight: 600, textTransform: "capitalize" }}>
                    {job.order.productType} — {job.order.quantityOrdered.toLocaleString()} {job.order.unit}
                  </span>
                  {job.order.totalAmount > 0 && (
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
                      KES {job.order.totalAmount.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Pickup / Delivery */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                  <div style={{ fontSize: 11.5, display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <Droplets size={11} color="#14b8a6" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 1px", fontWeight: 600 }}>PICKUP</p>
                      <p style={{ margin: 0, fontWeight: 500, color: "var(--text-primary)" }}>
                        {job.waterSource?.name ?? "To be set on dispatch"}
                      </p>
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, display: "flex", alignItems: "flex-start", gap: 4 }}>
                    <MapPin size={11} color="#2563eb" style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "0 0 1px", fontWeight: 600 }}>DELIVERY</p>
                      <p style={{ margin: 0, fontWeight: 500, color: "var(--text-primary)" }}>{job.order.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Requested date */}
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-muted)", marginBottom: 12 }}>
                  <Calendar size={11} />
                  {job.order.scheduledAt
                    ? `Scheduled: ${new Date(job.order.scheduledAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}`
                    : `Ordered: ${new Date(job.order.createdAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}`}
                </div>

                <button
                  onClick={() => setAssignModal({ job })}
                  className="ff-btn ff-btn-primary"
                  style={{ width: "100%" }}
                >
                  <Truck size={13} /> Assign Driver & Vehicle
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── ASSIGNED ── */}
      {tab === "assigned" && (
        assignedJobs.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <ClipboardList size={40} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0 }}>No assigned jobs. Assign from the Unassigned tab.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 12 }}>
            {assignedJobs.map(job => <JobCard key={job.id} job={job} onStatusChange={updateJobStatus} />)}
          </div>
        )
      )}

      {/* ── IN PROGRESS ── */}
      {tab === "in_progress" && (
        inProgressJobs.length === 0 ? (
          <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
            <Radio size={40} style={{ marginBottom: 12 }} />
            <p style={{ margin: 0 }}>No trips currently in progress.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))", gap: 12 }}>
            {inProgressJobs.map(job => <JobCard key={job.id} job={job} onStatusChange={updateJobStatus} />)}
          </div>
        )
      )}

      {/* ── COMPLETED ── */}
      {tab === "completed" && (
        <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="ff-table">
            <thead>
              <tr>
                <th>Order</th><th>Customer</th><th>Driver</th><th>Conductor</th>
                <th>Vehicle</th><th>Qty</th><th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {completedJobs.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 20px" }}>No deliveries completed yet</td></tr>
              ) : completedJobs.map(job => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>{job.order.orderNumber}</td>
                  <td>{job.order.customer.name}</td>
                  <td>{job.driver?.name ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{job.conductor?.name ?? "—"}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{job.vehicle?.plateNumber ?? "—"}</td>
                  <td>{job.order.quantityOrdered.toLocaleString()} {job.order.unit}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 11.5 }}>
                    {job.completedAt ? new Date(job.completedAt).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {assignModal && (
        <div className="ff-modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="ff-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Assign {assignModal.job.order.orderNumber}</h3>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0" }}>
                  {assignModal.job.order.customer.name} · {assignModal.job.order.quantityOrdered.toLocaleString()} {assignModal.job.order.unit}
                </p>
              </div>
              <button onClick={() => setAssignModal(null)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ background: "var(--background)", borderRadius: 8, padding: "10px 12px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: "var(--text-muted)", marginBottom: 4 }}>
                <MapPin size={11} color="#2563eb" />
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{assignModal.job.order.deliveryAddress}</span>
              </div>
              {assignModal.job.order.scheduledAt && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--text-muted)" }}>
                  <Calendar size={11} />
                  Scheduled: {new Date(assignModal.job.order.scheduledAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
                  Driver <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select className="ff-input" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
                  <option value="">Choose available driver…</option>
                  {(data?.availableDrivers ?? []).map(d => (
                    <option key={d.id} value={d.id}>{d.name}{d.phone ? ` · ${d.phone}` : ""}</option>
                  ))}
                </select>
                {(data?.availableDrivers ?? []).length === 0 && (
                  <p style={{ fontSize: 11, color: "#d97706", margin: "4px 0 0" }}>No available drivers right now.</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Conductor</label>
                <select className="ff-input" value={selectedConductor} onChange={e => setSelectedConductor(e.target.value)}>
                  <option value="">No conductor</option>
                  {(data?.availableConductors ?? []).map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>
                  Vehicle <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <select className="ff-input" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                  <option value="">Choose available vehicle…</option>
                  {(data?.availableVehicles ?? []).map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber} — {v.make} {v.model} ({v.capacityLitres.toLocaleString()} L)
                    </option>
                  ))}
                </select>
                {(data?.availableVehicles ?? []).length === 0 && (
                  <p style={{ fontSize: 11, color: "#d97706", margin: "4px 0 0" }}>No available vehicles right now.</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 5 }}>Water Source (Pickup)</label>
                <select className="ff-input" value={selectedWaterSource} onChange={e => setSelectedWaterSource(e.target.value)}>
                  <option value="">Select water source…</option>
                  {(data?.waterSources ?? []).map(w => (
                    <option key={w.id} value={w.id}>{w.name} — {w.address}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                <button
                  onClick={assignJob}
                  disabled={assigning || !selectedDriver || !selectedVehicle}
                  className="ff-btn ff-btn-primary"
                  style={{ flex: 1 }}
                >
                  {assigning ? "Assigning…" : "Confirm Assignment"}
                </button>
                <button onClick={() => setAssignModal(null)} className="ff-btn ff-btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared job card used in Assigned + In Progress tabs ── */
function JobCard({ job, onStatusChange }: { job: Job; onStatusChange: (id: string, status: string) => void }) {
  return (
    <div className="ff-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: "var(--accent)", fontFamily: "monospace" }}>
          {job.order.orderNumber}
        </span>
        <span className={`ff-badge ${STATUS_COLOR[job.status] ?? "ff-badge-gray"}`}>
          {job.status.replace(/_/g, " ")}
        </span>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{job.order.customer.name}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        <Package size={10} />
        {job.order.quantityOrdered.toLocaleString()} {job.order.unit} · {job.order.productType}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {[
          { label: "DRIVER",       value: job.driver?.name,         sub: job.driver?.phone },
          { label: "CONDUCTOR",    value: job.conductor?.name,      sub: job.conductor?.phone },
          { label: "VEHICLE",      value: job.vehicle?.plateNumber, sub: job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : undefined },
          { label: "WATER SOURCE", value: job.waterSource?.name,    sub: job.waterSource?.address },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: "var(--background)", borderRadius: 6, padding: "6px 8px" }}>
            <div style={{ fontSize: 9.5, color: "var(--text-muted)", marginBottom: 2, fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{value ?? "—"}</div>
            {sub && <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{sub}</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-muted)", marginBottom: 8 }}>
        <MapPin size={10} color="#2563eb" />
        {job.order.deliveryAddress}
      </div>

      {job.driver?.locations?.[0] && (
        <div style={{ fontSize: 11, color: "#22c55e", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} className="pulse-dot" />
          GPS: {job.driver.locations[0].lat.toFixed(4)}, {job.driver.locations[0].lng.toFixed(4)}
        </div>
      )}

      {job.assignedAt && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
          Assigned: {new Date(job.assignedAt).toLocaleString("en-KE", { dateStyle: "short", timeStyle: "short" })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <button onClick={() => onStatusChange(job.id, "cancelled")} className="ff-btn ff-btn-danger ff-btn-sm">
          Cancel
        </button>
        {job.status === "assigned" && (
          <button onClick={() => onStatusChange(job.id, "delivered")} className="ff-btn ff-btn-success ff-btn-sm">
            Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}
