"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Truck, MapPin, Phone, Package, CheckCircle2, ChevronRight,
  Navigation, AlertCircle, LogOut, Star, Clock, User
} from "lucide-react";
import type { MapMarker } from "@/components/LiveMap";

const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => <div style={{ height: 220, borderRadius: 10, background: "#e8f4f8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#64748b" }}>Loading map…</div>,
});

type Job = {
  id: string; status: string;
  order: { orderNumber: string; quantityOrdered: number; unit: string; productType: string; deliveryAddress: string; customer: { name: string; phone: string; address: string } };
  vehicle: { plateNumber: string; make: string; model: string; capacityLitres: number } | null;
  proofOfDelivery: { deliveredAt: string } | null;
};
type DriverInfo = { id: string; name: string; phone: string; status: string; rating: number; totalTrips: number };

const STATUS_STEPS = [
  { key: "assigned", label: "Accepted", icon: CheckCircle2, next: "en_route_source", nextLabel: "En Route to Source" },
  { key: "en_route_source", label: "En Route to Source", icon: Navigation, next: "loading", nextLabel: "Start Loading" },
  { key: "loading", label: "Loading", icon: Package, next: "en_route_customer", nextLabel: "En Route to Customer" },
  { key: "en_route_customer", label: "En Route to Customer", icon: Truck, next: "arrived", nextLabel: "Arrived at Customer" },
  { key: "arrived", label: "Arrived at Customer", icon: MapPin, next: "delivered", nextLabel: "Mark Delivered ✓" },
];

const STATUS_COLOR: Record<string, string> = {
  assigned: "#2563eb", en_route_source: "#7c3aed", loading: "#d97706",
  en_route_customer: "#7c3aed", arrived: "#059669", delivered: "#22c55e", cancelled: "#dc2626",
};

export default function DriverPortal() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [driver, setDriver] = useState<DriverInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState("");
  const [qty, setQty] = useState("");
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/driver/jobs");
    if (res.status === 401) { router.push("/driver-login"); return; }
    if (res.ok) {
      const data = await res.json();
      setDriver(data.driver);
      setJobs(data.jobs);
      const active = data.jobs.find((j: Job) => !["delivered","cancelled","failed"].includes(j.status));
      if (active) setActiveJob(active);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchJobs();
    const t = setInterval(fetchJobs, 30000);
    return () => clearInterval(t);
  }, [fetchJobs]);

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const { latitude: lat, longitude: lng, accuracy, speed, heading } = pos.coords;
        setMyPos({ lat, lng });
        fetch("/api/driver/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lng, accuracy, speed, heading }),
        });
      },
      null,
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  async function updateStatus(jobId: string, status: string) {
    setUpdating(true);
    await fetch(`/api/driver/jobs/${jobId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes, actualQuantity: qty }),
    });
    setUpdating(false);
    fetchJobs();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/driver-login");
  }

  if (loading) {
    return (
      <div style={{ minHeight:"100vh",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12 }}>
        <Truck size={32} color="var(--accent)" />
        <p style={{ color:"var(--text-muted)",fontSize:14 }}>Loading your jobs...</p>
      </div>
    );
  }

  const todayJobs = jobs.filter(j => j.status !== "delivered" || new Date(j.proofOfDelivery?.deliveredAt ?? 0) > new Date(new Date().setHours(0,0,0,0)));

  return (
    <div className="driver-layout">
      {/* Header */}
      <div style={{ background:"var(--sidebar)",color:"#fff",padding:"12px 16px",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:36,height:36,borderRadius:"50%",background:"rgba(37,99,235,0.4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700 }}>
              {driver?.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase() ?? "?"}
            </div>
            <div>
              <div style={{ fontWeight:700,fontSize:14 }}>{driver?.name ?? "Driver"}</div>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)",display:"flex",alignItems:"center",gap:4 }}>
                <div style={{ width:6,height:6,borderRadius:"50%",background:driver?.status==="available"?"#22c55e":"#f59e0b" }} />
                {driver?.status?.replace(/_/g," ") ?? "offline"}
              </div>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.5)" }}>Trips</div>
              <div style={{ fontSize:14,fontWeight:700 }}>{driver?.totalTrips ?? 0}</div>
            </div>
            <button onClick={handleLogout} style={{ background:"rgba(255,255,255,0.1)",border:"none",borderRadius:8,padding:"6px 10px",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:5,fontSize:12 }}>
              <LogOut size={13}/> Out
            </button>
          </div>
        </div>
      </div>

      {/* Active Job Banner */}
      {activeJob && (
        <div style={{ background:"linear-gradient(135deg,#2563eb,#1d4ed8)",color:"#fff",padding:"14px 16px",margin:"0 0 4px" }}>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em" }}>Active Job</div>
          <div style={{ fontSize:16,fontWeight:700,marginBottom:2 }}>{activeJob.order.orderNumber}</div>
          <div style={{ fontSize:13,color:"rgba(255,255,255,0.85)",marginBottom:8 }}>{activeJob.order.customer.name}</div>
          <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.15)",borderRadius:99,padding:"4px 10px",fontSize:12 }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:STATUS_COLOR[activeJob.status]??"#fff" }} className="pulse-dot" />
            {activeJob.status.replace(/_/g," ").toUpperCase()}
          </div>
        </div>
      )}

      <div style={{ padding:"12px 0" }}>
        {/* Active job detail card */}
        {activeJob && (() => {
          const stepIdx = STATUS_STEPS.findIndex(s => s.key === activeJob.status);
          const step = STATUS_STEPS[stepIdx];
          const progress = stepIdx >= 0 ? ((stepIdx + 1) / STATUS_STEPS.length) * 100 : 0;

          return (
            <div className="driver-card" style={{ border:"2px solid var(--accent)" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                <span style={{ fontSize:13,fontWeight:700,color:"var(--accent)" }}>Current Trip</span>
                <span style={{ fontSize:12,fontWeight:600,color:STATUS_COLOR[activeJob.status]??"#666" }}>{activeJob.status.replace(/_/g," ")}</span>
              </div>

              {/* Progress bar */}
              <div style={{ background:"#e2e8f0",borderRadius:99,height:6,marginBottom:14 }}>
                <div style={{ width:`${progress}%`,background:"var(--accent)",borderRadius:99,height:"100%",transition:"width 0.3s ease" }} />
              </div>

              {/* Customer info */}
              <div style={{ background:"#f8fafc",borderRadius:8,padding:"10px 12px",marginBottom:12 }}>
                <div style={{ fontSize:11,color:"var(--text-muted)",marginBottom:4,fontWeight:500 }}>CUSTOMER</div>
                <div style={{ fontSize:14,fontWeight:700,marginBottom:2 }}>{activeJob.order.customer.name}</div>
                <a href={`tel:${activeJob.order.customer.phone}`} style={{ display:"flex",alignItems:"center",gap:6,color:"var(--accent)",fontSize:13,textDecoration:"none",marginBottom:6 }}>
                  <Phone size={13}/>{activeJob.order.customer.phone}
                </a>
                <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"var(--text-muted)" }}>
                  <MapPin size={12}/>{activeJob.order.deliveryAddress}
                </div>
              </div>

              {/* Trip details */}
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14 }}>
                <div style={{ background:"#f8fafc",borderRadius:8,padding:"8px 10px" }}>
                  <div style={{ fontSize:10,color:"var(--text-muted)",marginBottom:2 }}>QUANTITY</div>
                  <div style={{ fontSize:13,fontWeight:700 }}>{activeJob.order.quantityOrdered.toLocaleString()} {activeJob.order.unit}</div>
                </div>
                <div style={{ background:"#f8fafc",borderRadius:8,padding:"8px 10px" }}>
                  <div style={{ fontSize:10,color:"var(--text-muted)",marginBottom:2 }}>VEHICLE</div>
                  <div style={{ fontSize:13,fontWeight:700 }}>{activeJob.vehicle?.plateNumber ?? "—"}</div>
                </div>
              </div>

              {/* Navigation button */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeJob.order.deliveryAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",background:"#1e293b",color:"#fff",borderRadius:8,textDecoration:"none",fontSize:13,fontWeight:600,marginBottom:12 }}
              >
                <Navigation size={15}/> Navigate to Customer
              </a>

              {/* Live map */}
              {(() => {
                const mapMarkers: MapMarker[] = [];
                if (myPos) mapMarkers.push({ ...myPos, type: "current", label: "Your Location", sublabel: "GPS updated just now" });
                // If order has delivery coords show destination marker
                return (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: myPos ? "#22c55e" : "#d97706" }} className={myPos ? "pulse-dot" : undefined} />
                      {myPos ? "GPS Active — sharing location" : "Waiting for GPS signal…"}
                    </div>
                    <LiveMap
                      markers={mapMarkers}
                      center={myPos ? [myPos.lat, myPos.lng] : [-1.2921, 36.8219]}
                      zoom={myPos ? 14 : 11}
                      height={220}
                    />
                  </div>
                );
              })()}

              {/* Status notes */}
              {step && step.next === "delivered" && (
                <>
                  <input
                    className="ff-input"
                    style={{ marginBottom:8 }}
                    placeholder="Actual quantity delivered"
                    type="number"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                  />
                  <textarea
                    className="ff-input"
                    style={{ marginBottom:8 }}
                    placeholder="Delivery notes (optional)"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                  />
                </>
              )}

              {/* Next status button */}
              {step && (
                <button
                  onClick={() => updateStatus(activeJob.id, step.next)}
                  disabled={updating}
                  style={{ width:"100%",padding:"12px",background:step.next==="delivered"?"#16a34a":"var(--accent)",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}
                >
                  {updating ? "Updating..." : step.nextLabel}
                  {!updating && <ChevronRight size={16} />}
                </button>
              )}
            </div>
          );
        })()}

        {/* Today's jobs list */}
        <div style={{ padding:"0 16px",marginBottom:8 }}>
          <h3 style={{ fontSize:13,fontWeight:700,color:"var(--text-muted)",margin:"0 0 10px",textTransform:"uppercase",letterSpacing:"0.05em" }}>All Assigned Jobs</h3>
        </div>

        {jobs.length === 0 ? (
          <div style={{ padding:"40px 20px",textAlign:"center" }}>
            <CheckCircle2 size={40} color="var(--text-muted)" style={{ marginBottom:12 }} />
            <p style={{ color:"var(--text-muted)",fontSize:14 }}>No jobs assigned yet.</p>
            <p style={{ color:"var(--text-muted)",fontSize:12 }}>Your dispatcher will assign jobs here.</p>
          </div>
        ) : jobs.map(job => (
          <div key={job.id} className="driver-card" onClick={() => setActiveJob(job)} style={{ cursor:"pointer", borderLeft:`3px solid ${STATUS_COLOR[job.status]??"#e2e8f0"}` }}>
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6 }}>
              <span style={{ fontWeight:700,color:"var(--accent)",fontSize:13 }}>{job.order.orderNumber}</span>
              <span style={{ fontSize:11,fontWeight:600,color:STATUS_COLOR[job.status]??"#666",background:STATUS_COLOR[job.status]+"18",padding:"2px 8px",borderRadius:99 }}>
                {job.status.replace(/_/g," ")}
              </span>
            </div>
            <div style={{ fontSize:13,fontWeight:600,marginBottom:3 }}>{job.order.customer.name}</div>
            <div style={{ fontSize:12,color:"var(--text-muted)",display:"flex",alignItems:"center",gap:4 }}>
              <Package size={11}/>{job.order.quantityOrdered.toLocaleString()} {job.order.unit}
              {job.vehicle && <><span>·</span><Truck size={11}/>{job.vehicle.plateNumber}</>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
