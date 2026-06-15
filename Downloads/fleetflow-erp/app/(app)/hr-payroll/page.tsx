"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, DollarSign, Calculator, Clock, CheckCircle2, ChevronDown, ChevronUp, Save, Pencil } from "lucide-react";
import AddEmployeeModal from "@/components/AddEmployeeModal";
import DeleteEmployeeModal from "@/components/DeleteEmployeeModal";
import EditEmployeeModal from "@/components/EditEmployeeModal";

type UserRow = { id: string; name: string; email: string; role: string; lastLoginAt: string | null; isActive: boolean; monthlySalary: number | null; avatarUrl: string | null };
type DriverRow = { id: string; name: string; phone: string; licenseNumber: string; licenseExpiry: string; totalTrips: number; rating: number; status: string; avatarUrl?: string | null };
type DriverRate = {
  id: string; name: string; phone: string; status: string;
  payRate: { payType: string; perTripRate: number; perDayRate: number } | null;
};
type PayrollLine = {
  personType: "driver" | "conductor";
  driverId: string | null; conductorId: string | null;
  driverName: string; payType: string;
  tripsCount: number; daysWorked: number;
  perTripRate: number; perDayRate: number;
  tripEarnings: number; dayEarnings: number; totalEarnings: number;
};
type PayrollRun = {
  id: string; periodStart: string; periodEnd: string; status: string;
  totalAmount: number; approvedBy: string | null; approvedAt: string | null; paidAt: string | null;
  createdAt: string; lines: PayrollLine[];
};

const ROLE_COLOR: Record<string, string> = {
  company_admin: "ff-badge-purple", dispatcher: "ff-badge-blue", driver: "ff-badge-green",
  conductor: "ff-badge-teal", accountant: "ff-badge-yellow", mechanic: "ff-badge-orange",
  customer_support: "ff-badge-gray",
};

const PAY_TYPES = [
  { value: "per_trip", label: "Per Trip" },
  { value: "per_day", label: "Per Day" },
  { value: "both", label: "Trip + Day" },
];

const STATUS_BADGE: Record<string, string> = { draft: "ff-badge-gray", approved: "ff-badge-blue", paid: "ff-badge-green" };
const fmt = (n: number) => `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function today() { return new Date().toISOString().slice(0, 10); }
function firstOfMonth() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export default function HRPayrollPage() {
  const [tab, setTab] = useState<"staff" | "rates" | "run" | "history">("staff");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [drivers, setDrivers] = useState<DriverRow[]>([]);
  const [driverRates, setDriverRates] = useState<DriverRate[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editDriver, setEditDriver] = useState<DriverRow | null>(null);

  // Driver rate editing state — map driverId → draft values
  const [rateEdits, setRateEdits] = useState<Record<string, { payType: string; perTripRate: string; perDayRate: string }>>({});
  const [savingRate, setSavingRate] = useState<string | null>(null);
  // Staff salary editing state — map userId → draft salary string
  const [salaryEdits, setSalaryEdits] = useState<Record<string, string>>({});
  const [savingSalary, setSavingSalary] = useState<string | null>(null);

  // Payroll run state
  const [periodStart, setPeriodStart] = useState(firstOfMonth());
  const [periodEnd, setPeriodEnd] = useState(today());
  const [calculating, setCalculating] = useState(false);
  const [preview, setPreview] = useState<{ lines: PayrollLine[]; totalAmount: number } | null>(null);
  const [runNotes, setRunNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [hrRes, sessionRes, ratesRes, runsRes] = await Promise.all([
      fetch("/api/hr"),
      fetch("/api/auth/me"),
      fetch("/api/payroll/rates"),
      fetch("/api/payroll/runs"),
    ]);
    if (hrRes.ok) {
      const d = await hrRes.json();
      const loadedUsers: UserRow[] = d.users ?? [];
      setUsers(loadedUsers);
      setDrivers(d.drivers ?? []);
      // Seed salary edits from DB
      const salaryInit: Record<string, string> = {};
      loadedUsers.forEach(u => { salaryInit[u.id] = u.monthlySalary !== null ? String(u.monthlySalary) : ""; });
      setSalaryEdits(salaryInit);
    }
    if (sessionRes.ok) { const s = await sessionRes.json(); setRole(s.role); }
    if (ratesRes.ok) {
      const dr: DriverRate[] = await ratesRes.json();
      setDriverRates(dr);
      // Seed edit state from DB so every driver has an entry — no stale-closure issues
      const initial: Record<string, { payType: string; perTripRate: string; perDayRate: string }> = {};
      dr.forEach(d => {
        initial[d.id] = {
          payType: d.payRate?.payType ?? "per_trip",
          perTripRate: String(d.payRate?.perTripRate ?? 0),
          perDayRate: String(d.payRate?.perDayRate ?? 0),
        };
      });
      setRateEdits(initial);
    }
    if (runsRes.ok) { setPayrollRuns(await runsRes.json()); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function setRateField(driverId: string, field: string, value: string) {
    setRateEdits(prev => ({ ...prev, [driverId]: { ...prev[driverId], [field]: value } }));
  }

  function isDirty(driver: DriverRate) {
    const e = rateEdits[driver.id];
    if (!e) return false;
    const saved = driver.payRate;
    return (
      e.payType !== (saved?.payType ?? "per_trip") ||
      Number(e.perTripRate) !== (saved?.perTripRate ?? 0) ||
      Number(e.perDayRate) !== (saved?.perDayRate ?? 0)
    );
  }

  async function saveSalary(userId: string) {
    setSavingSalary(userId);
    const val = salaryEdits[userId];
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlySalary: val === "" ? null : Number(val) }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, monthlySalary: val === "" ? null : Number(val) } : u));
    setSavingSalary(null);
  }

  async function saveRate(driverId: string) {
    const edit = rateEdits[driverId];
    if (!edit) return;
    setSavingRate(driverId);
    await fetch("/api/payroll/rates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ driverId, payType: edit.payType, perTripRate: Number(edit.perTripRate), perDayRate: Number(edit.perDayRate) }),
    });
    setSavingRate(null);
    const res = await fetch("/api/payroll/rates");
    if (res.ok) {
      const dr: DriverRate[] = await res.json();
      setDriverRates(dr);
      const refreshed: Record<string, { payType: string; perTripRate: string; perDayRate: string }> = {};
      dr.forEach(d => {
        refreshed[d.id] = {
          payType: d.payRate?.payType ?? "per_trip",
          perTripRate: String(d.payRate?.perTripRate ?? 0),
          perDayRate: String(d.payRate?.perDayRate ?? 0),
        };
      });
      setRateEdits(refreshed);
    }
  }

  async function calculate() {
    setCalculating(true);
    setPreview(null);
    const res = await fetch("/api/payroll/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodStart, periodEnd }),
    });
    if (res.ok) setPreview(await res.json());
    setCalculating(false);
  }

  async function approveRun() {
    if (!preview) return;
    setSaving(true);
    const res = await fetch("/api/payroll/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodStart, periodEnd, lines: preview.lines, totalAmount: preview.totalAmount, notes: runNotes }),
    });
    if (res.ok) {
      setPreview(null); setRunNotes("");
      const runsRes = await fetch("/api/payroll/runs");
      if (runsRes.ok) setPayrollRuns(await runsRes.json());
      setTab("history");
    }
    setSaving(false);
  }

  async function markPaid(id: string) {
    setMarkingPaid(id);
    await fetch("/api/payroll/runs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPayrollRuns(runs => runs.map(r => r.id === id ? { ...r, status: "paid", paidAt: new Date().toISOString() } : r));
    setMarkingPaid(null);
  }

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>;

  const isAdmin = role === "company_admin";

  return (
    <div className="slide-in">
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>HR &amp; Payroll</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>Staff management, pay rates and payroll runs</p>
        </div>
        {isAdmin && <AddEmployeeModal onAdded={load} />}
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
        {[
          { label: "Total Staff", value: users.length, color: "#2563eb", icon: <Users size={15} /> },
          { label: "Drivers", value: drivers.length, color: "#16a34a", icon: <Users size={15} /> },
          { label: "Active Drivers", value: drivers.filter(d => ["available","on_trip"].includes(d.status)).length, color: "#d97706", icon: <Clock size={15} /> },
          { label: "Payroll Runs", value: payrollRuns.length, color: "#7c3aed", icon: <DollarSign size={15} /> },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className="ff-card" style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "var(--text-muted)", fontSize: 11 }}>
              {icon}{label}
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {[
          { key: "staff", label: "Staff" },
          { key: "rates", label: "Pay Rates" },
          ...(isAdmin ? [{ key: "run", label: "Run Payroll" }] : []),
          { key: "history", label: "History" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            style={{ padding: "8px 16px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? "var(--accent)" : "transparent"}`, cursor: "pointer", fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "var(--accent)" : "var(--text-muted)", marginBottom: -1, borderRadius: "4px 4px 0 0" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STAFF TAB ── */}
      {tab === "staff" && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>System Users</h2>
          <div className="ff-card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            {users.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}><Users size={36} color="var(--text-muted)" /><p style={{ color: "var(--text-muted)", marginTop: 8 }}>No users found</p></div>
            ) : (
              <table className="ff-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th>{isAdmin && <th></th>}</tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span style={{ fontWeight: 600 }}>{u.name}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12.5 }}>{u.email}</td>
                      <td><span className={`ff-badge ${ROLE_COLOR[u.role] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{u.role.replace(/_/g, " ")}</span></td>
                      <td style={{ color: "var(--text-muted)", fontSize: 11.5 }}>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("en-KE") : "Never"}</td>
                      <td><span className={`ff-badge ${u.isActive ? "ff-badge-green" : "ff-badge-red"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button onClick={() => setEditUser(u)} className="ff-btn ff-btn-ghost ff-btn-sm"><Pencil size={12} /> Edit</button>
                            <DeleteEmployeeModal type="user" id={u.id} name={u.name} role={u.role} onDeleted={load} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>Driver &amp; Conductor Roster</h2>
          <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
            {drivers.length === 0 && users.filter(u => u.role === "conductor").length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}><p style={{ color: "var(--text-muted)" }}>No drivers or conductors found</p></div>
            ) : (
              <table className="ff-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>License #</th>
                    <th>License Expiry</th>
                    <th>Trips</th>
                    <th>Status</th>
                    {isAdmin && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {drivers.map(d => {
                    const expired = new Date(d.licenseExpiry) < new Date();
                    return (
                      <tr key={d.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {d.avatarUrl ? (
                              <img src={d.avatarUrl} alt={d.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {d.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontWeight: 600 }}>{d.name}</span>
                          </div>
                        </td>
                        <td><span className="ff-badge ff-badge-green" style={{ fontSize: 10.5 }}>Driver</span></td>
                        <td style={{ color: "var(--text-muted)" }}>{d.phone}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 12 }}>{d.licenseNumber}</td>
                        <td style={{ color: expired ? "#dc2626" : "var(--text-muted)", fontSize: 11.5 }}>
                          {new Date(d.licenseExpiry).toLocaleDateString("en-KE")}
                          {expired && <span style={{ marginLeft: 4, fontSize: 10, fontWeight: 700, color: "#dc2626" }}>EXPIRED</span>}
                        </td>
                        <td style={{ textAlign: "center" }}>{d.totalTrips}</td>
                        <td><span className={`ff-badge ${d.status === "available" ? "ff-badge-green" : d.status === "on_trip" ? "ff-badge-blue" : "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{d.status.replace(/_/g, " ")}</span></td>
                        {isAdmin && (
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <button onClick={() => setEditDriver(d)} className="ff-btn ff-btn-ghost ff-btn-sm"><Pencil size={12} /> Edit</button>
                              <DeleteEmployeeModal type="driver" id={d.id} name={d.name} role="driver" onDeleted={load} />
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {users.filter(u => u.role === "conductor").map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt={c.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                              {c.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span style={{ fontWeight: 600 }}>{c.name}</span>
                        </div>
                      </td>
                      <td><span className="ff-badge ff-badge-teal" style={{ fontSize: 10.5 }}>Conductor</span></td>
                      <td style={{ color: "var(--text-muted)" }}>{c.email || "—"}</td>
                      <td style={{ color: "var(--text-muted)" }}>—</td>
                      <td style={{ color: "var(--text-muted)" }}>—</td>
                      <td style={{ textAlign: "center", color: "var(--text-muted)" }}>—</td>
                      <td><span className="ff-badge ff-badge-green">Active</span></td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button onClick={() => setEditUser(c)} className="ff-btn ff-btn-ghost ff-btn-sm"><Pencil size={12} /> Edit</button>
                            <DeleteEmployeeModal type="user" id={c.id} name={c.name} role="conductor" onDeleted={load} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── PAY RATES TAB ── */}
      {tab === "rates" && (
        <>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Driver & Conductor Pay Rates</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
              Drivers can be paid per trip, per day, or both. Conductors are always paid per trip.
              {!isAdmin && " Only admins can edit rates."}
            </p>
          </div>

          {/* Staff monthly salaries — conductors excluded */}
          {users.filter(u => u.role !== "conductor").length > 0 && (
            <>
              <div style={{ margin: "20px 0 8px" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Staff Monthly Salaries</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  Set fixed monthly salaries for non-driver staff.
                  {!isAdmin && " Only admins can edit salaries."}
                </p>
              </div>
              <div className="ff-card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
                <table className="ff-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Monthly Salary (KES)</th>
                      {isAdmin && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role !== "conductor").map(u => {
                      const draft = salaryEdits[u.id] ?? "";
                      const savedVal = u.monthlySalary !== null ? String(u.monthlySalary) : "";
                      const dirty = draft !== savedVal;
                      return (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</td>
                          <td>
                            <span className={`ff-badge ${ROLE_COLOR[u.role] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>
                              {u.role.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td>
                            {isAdmin ? (
                              <input
                                className="ff-input"
                                type="number"
                                min={0}
                                placeholder="e.g. 45000"
                                value={draft}
                                onChange={e => setSalaryEdits(prev => ({ ...prev, [u.id]: e.target.value }))}
                                style={{ fontSize: 12, padding: "4px 8px", width: 130 }}
                              />
                            ) : (
                              <span style={{ fontSize: 13, fontWeight: 600 }}>
                                {u.monthlySalary !== null ? fmt(u.monthlySalary) : <span style={{ color: "var(--text-muted)" }}>Not set</span>}
                              </span>
                            )}
                          </td>
                          {isAdmin && (
                            <td>
                              <button
                                onClick={() => saveSalary(u.id)}
                                disabled={savingSalary === u.id || !dirty}
                                style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: dirty ? "var(--accent)" : "#f1f5f9", color: dirty ? "#fff" : "var(--text-muted)", border: "none", borderRadius: 6, cursor: dirty ? "pointer" : "default", fontSize: 12, fontWeight: 600, opacity: savingSalary === u.id ? 0.6 : 1 }}
                              >
                                <Save size={12} />
                                {savingSalary === u.id ? "Saving…" : "Save"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="ff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Pay Type</th>
                  <th>Per Trip (KES)</th>
                  <th>Per Day (KES)</th>
                  {isAdmin && <th></th>}
                </tr>
              </thead>
              <tbody>
                {driverRates.map(driver => {
                  const edit = rateEdits[driver.id] ?? { payType: "per_trip", perTripRate: "0", perDayRate: "0" };
                  const dirty = isDirty(driver);
                  return (
                    <tr key={driver.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{driver.name}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{driver.phone}</div>
                      </td>
                      <td><span className="ff-badge ff-badge-green" style={{ fontSize: 10.5 }}>Driver</span></td>
                      <td>
                        {isAdmin ? (
                          <select
                            className="ff-input"
                            value={edit.payType}
                            onChange={e => setRateField(driver.id, "payType", e.target.value)}
                            style={{ fontSize: 12, padding: "4px 8px", minWidth: 110 }}
                          >
                            {PAY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                          </select>
                        ) : (
                          <span className="ff-badge ff-badge-blue" style={{ textTransform: "capitalize" }}>
                            {PAY_TYPES.find(p => p.value === edit.payType)?.label ?? edit.payType}
                          </span>
                        )}
                      </td>
                      <td>
                        {isAdmin ? (
                          <input
                            className="ff-input"
                            type="number"
                            min={0}
                            value={edit.perTripRate}
                            onChange={e => setRateField(driver.id, "perTripRate", e.target.value)}
                            disabled={edit.payType === "per_day"}
                            style={{ fontSize: 12, padding: "4px 8px", width: 90, opacity: edit.payType === "per_day" ? 0.4 : 1 }}
                          />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{Number(edit.perTripRate).toLocaleString()}</span>
                        )}
                      </td>
                      <td>
                        {isAdmin ? (
                          <input
                            className="ff-input"
                            type="number"
                            min={0}
                            value={edit.perDayRate}
                            onChange={e => setRateField(driver.id, "perDayRate", e.target.value)}
                            disabled={edit.payType === "per_trip"}
                            style={{ fontSize: 12, padding: "4px 8px", width: 90, opacity: edit.payType === "per_trip" ? 0.4 : 1 }}
                          />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{Number(edit.perDayRate).toLocaleString()}</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td>
                          <button
                            onClick={() => saveRate(driver.id)}
                            disabled={savingRate === driver.id}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: dirty ? "var(--accent)" : "#f1f5f9", color: dirty ? "#fff" : "var(--text-muted)", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, opacity: savingRate === driver.id ? 0.6 : 1 }}
                          >
                            <Save size={12} />
                            {savingRate === driver.id ? "Saving…" : "Save"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {users.filter(u => u.role === "conductor").map(conductor => {
                  const draft = salaryEdits[conductor.id] ?? "";
                  const savedVal = conductor.monthlySalary !== null ? String(conductor.monthlySalary) : "";
                  const dirty = draft !== savedVal;
                  return (
                    <tr key={conductor.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{conductor.name}</div>
                      </td>
                      <td><span className="ff-badge ff-badge-teal" style={{ fontSize: 10.5 }}>Conductor</span></td>
                      <td><span className="ff-badge ff-badge-blue" style={{ fontSize: 10.5 }}>Per Trip</span></td>
                      <td>
                        {isAdmin ? (
                          <input
                            className="ff-input"
                            type="number"
                            min={0}
                            placeholder="e.g. 500"
                            value={draft}
                            onChange={e => setSalaryEdits(prev => ({ ...prev, [conductor.id]: e.target.value }))}
                            style={{ fontSize: 12, padding: "4px 8px", width: 90 }}
                          />
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {conductor.monthlySalary !== null ? conductor.monthlySalary.toLocaleString() : <span style={{ color: "var(--text-muted)" }}>Not set</span>}
                          </span>
                        )}
                      </td>
                      <td><span style={{ color: "var(--text-muted)" }}>—</span></td>
                      {isAdmin && (
                        <td>
                          <button
                            onClick={() => saveSalary(conductor.id)}
                            disabled={savingSalary === conductor.id || !dirty}
                            style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: dirty ? "var(--accent)" : "#f1f5f9", color: dirty ? "#fff" : "var(--text-muted)", border: "none", borderRadius: 6, cursor: dirty ? "pointer" : "default", fontSize: 12, fontWeight: 600, opacity: savingSalary === conductor.id ? 0.6 : 1 }}
                          >
                            <Save size={12} />
                            {savingSalary === conductor.id ? "Saving…" : "Save"}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── RUN PAYROLL TAB ── */}
      {tab === "run" && isAdmin && (
        <>
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>Run Payroll</h2>
            <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Select a pay period, calculate earnings, then approve to save the record.</p>
          </div>

          {/* Period picker */}
          <div className="ff-card" style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Period Start</label>
                <input type="date" className="ff-input" value={periodStart} onChange={e => { setPeriodStart(e.target.value); setPreview(null); }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Period End</label>
                <input type="date" className="ff-input" value={periodEnd} onChange={e => { setPeriodEnd(e.target.value); setPreview(null); }} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: 5 }}>Notes (optional)</label>
                <input className="ff-input" placeholder="e.g. June 2026 payroll" value={runNotes} onChange={e => setRunNotes(e.target.value)} />
              </div>
              <button
                onClick={calculate}
                disabled={calculating}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                <Calculator size={14} />
                {calculating ? "Calculating…" : "Calculate"}
              </button>
            </div>
          </div>

          {/* Preview table */}
          {preview && (
            <>
              <div className="ff-card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Payroll Preview</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>Total: {fmt(preview.totalAmount)}</div>
                </div>
                <table className="ff-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Pay Type</th>
                      <th style={{ textAlign: "center" }}>Trips</th>
                      <th style={{ textAlign: "center" }}>Days</th>
                      <th style={{ textAlign: "right" }}>Trip Pay</th>
                      <th style={{ textAlign: "right" }}>Day Pay</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.lines.map(line => (
                      <tr key={line.conductorId ?? line.driverId ?? line.driverName} style={{ opacity: line.totalEarnings === 0 ? 0.5 : 1 }}>
                        <td style={{ fontWeight: 600 }}>{line.driverName}</td>
                        <td>
                          {line.personType === "conductor" ? (
                            <span className="ff-badge ff-badge-teal" style={{ fontSize: 10.5 }}>Conductor</span>
                          ) : (
                            <span className="ff-badge ff-badge-green" style={{ fontSize: 10.5 }}>Driver</span>
                          )}
                        </td>
                        <td>
                          <span className="ff-badge ff-badge-blue" style={{ textTransform: "capitalize", fontSize: 10.5 }}>
                            {PAY_TYPES.find(p => p.value === line.payType)?.label ?? line.payType}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{line.tripsCount}</td>
                        <td style={{ textAlign: "center", color: "var(--text-muted)" }}>
                          {line.personType === "conductor" ? "—" : line.daysWorked}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
                          {line.tripEarnings > 0 ? fmt(line.tripEarnings) : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
                          {line.dayEarnings > 0 ? fmt(line.dayEarnings) : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: line.totalEarnings > 0 ? "#16a34a" : "var(--text-muted)" }}>
                          {fmt(line.totalEarnings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#f8fafc" }}>
                      <td colSpan={7} style={{ fontWeight: 700, fontSize: 13, textAlign: "right", padding: "10px 12px" }}>Grand Total</td>
                      <td style={{ fontWeight: 800, fontSize: 14, color: "#16a34a", textAlign: "right", padding: "10px 12px", fontFamily: "monospace" }}>{fmt(preview.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button onClick={() => setPreview(null)} style={{ padding: "9px 16px", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>
                  Recalculate
                </button>
                <button
                  onClick={approveRun}
                  disabled={saving || preview.totalAmount === 0}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}
                >
                  <CheckCircle2 size={14} />
                  {saving ? "Saving…" : "Approve & Save Payroll"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 14px" }}>Payroll History</h2>
          {payrollRuns.length === 0 ? (
            <div className="ff-card" style={{ padding: "40px 20px", textAlign: "center" }}>
              <DollarSign size={36} color="var(--text-muted)" />
              <p style={{ color: "var(--text-muted)", marginTop: 8 }}>No payroll runs yet. Run payroll to get started.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {payrollRuns.map(run => (
                <div key={run.id} className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", cursor: "pointer" }}
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>
                          {new Date(run.periodStart).toLocaleDateString("en-KE")} — {new Date(run.periodEnd).toLocaleDateString("en-KE")}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                          {run.lines.length} staff · Approved by {run.approvedBy ?? "—"} · {new Date(run.createdAt).toLocaleDateString("en-KE")}
                        </div>
                      </div>
                      <span className={`ff-badge ${STATUS_BADGE[run.status] ?? "ff-badge-gray"}`} style={{ textTransform: "capitalize" }}>{run.status}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{fmt(run.totalAmount)}</span>
                      {isAdmin && run.status === "approved" && (
                        <button
                          onClick={e => { e.stopPropagation(); markPaid(run.id); }}
                          disabled={markingPaid === run.id}
                          style={{ padding: "5px 12px", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                        >
                          {markingPaid === run.id ? "…" : "Mark Paid"}
                        </button>
                      )}
                      {run.status === "paid" && run.paidAt && (
                        <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
                          ✓ Paid {new Date(run.paidAt).toLocaleDateString("en-KE")}
                        </span>
                      )}
                      {expandedRun === run.id ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {expandedRun === run.id && run.lines.length > 0 && (
                    <div style={{ borderTop: "1px solid var(--border)" }}>
                      <table className="ff-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Role</th>
                            <th style={{ textAlign: "center" }}>Trips</th>
                            <th style={{ textAlign: "center" }}>Days</th>
                            <th style={{ textAlign: "right" }}>Trip Pay</th>
                            <th style={{ textAlign: "right" }}>Day Pay</th>
                            <th style={{ textAlign: "right" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {run.lines.map(l => (
                            <tr key={l.conductorId ?? l.driverId ?? l.driverName}>
                              <td style={{ fontWeight: 600, fontSize: 12.5 }}>{l.driverName}</td>
                              <td>
                                {l.personType === "conductor" ? (
                                  <span className="ff-badge ff-badge-teal" style={{ fontSize: 10.5 }}>Conductor</span>
                                ) : (
                                  <span className="ff-badge ff-badge-green" style={{ fontSize: 10.5 }}>Driver</span>
                                )}
                              </td>
                              <td style={{ textAlign: "center", color: "var(--text-muted)" }}>{l.tripsCount}</td>
                              <td style={{ textAlign: "center", color: "var(--text-muted)" }}>
                                {l.personType === "conductor" ? "—" : l.daysWorked}
                              </td>
                              <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{l.tripEarnings > 0 ? fmt(l.tripEarnings) : "—"}</td>
                              <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>{l.dayEarnings > 0 ? fmt(l.dayEarnings) : "—"}</td>
                              <td style={{ textAlign: "right", fontWeight: 700, color: "#16a34a", fontFamily: "monospace" }}>{fmt(l.totalEarnings)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editUser && (
        <EditEmployeeModal
          type="user"
          employee={editUser}
          onSaved={load}
          onClose={() => setEditUser(null)}
        />
      )}
      {editDriver && (
        <EditEmployeeModal
          type="driver"
          employee={editDriver}
          onSaved={load}
          onClose={() => setEditDriver(null)}
        />
      )}
    </div>
  );
}
