import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

const EXPENSE_CATEGORIES = ["fuel", "maintenance", "salary", "insurance", "license", "office", "other"];

async function getPnLData(orgId: string) {
  const now = new Date();

  // Build last 6 months (including current)
  const months: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const label = start.toLocaleDateString("en-KE", { month: "short", year: "numeric" });
    months.push({ label, start, end });
  }

  const ytdStart = new Date(now.getFullYear(), 0, 1);

  // Revenue per month (paid invoices)
  const revenueByMonth = await Promise.all(
    months.map(m =>
      prisma.invoice.aggregate({
        where: { organizationId: orgId, status: "paid", updatedAt: { gte: m.start, lte: m.end } },
        _sum: { paidAmount: true },
      })
    )
  );

  // Fuel cost per month
  const fuelByMonth = await Promise.all(
    months.map(m =>
      prisma.fuelRecord.aggregate({
        where: { organizationId: orgId, date: { gte: m.start, lte: m.end } },
        _sum: { totalCost: true },
      })
    )
  );

  // Other expenses per month per category
  const expensesByMonth = await Promise.all(
    months.map(m =>
      prisma.expense.groupBy({
        by: ["category"],
        where: { organizationId: orgId, date: { gte: m.start, lte: m.end } },
        _sum: { amount: true },
      })
    )
  );

  // Lease cost (fixed monthly — sum of all leased vehicle rates)
  const leasedVehicles = await prisma.vehicle.findMany({
    where: { organizationId: orgId, ownership: "leased" },
    select: { leaseMonthlyRate: true },
  });
  const monthlyLeaseCost = leasedVehicles.reduce((s, v) => s + (v.leaseMonthlyRate ?? 0), 0);

  // YTD totals
  const [ytdRevenue, ytdFuel, ytdExpenses] = await Promise.all([
    prisma.invoice.aggregate({ where: { organizationId: orgId, status: "paid", updatedAt: { gte: ytdStart } }, _sum: { paidAmount: true } }),
    prisma.fuelRecord.aggregate({ where: { organizationId: orgId, date: { gte: ytdStart } }, _sum: { totalCost: true } }),
    prisma.expense.groupBy({ by: ["category"], where: { organizationId: orgId, date: { gte: ytdStart } }, _sum: { amount: true } }),
  ]);

  const ytdMonths = now.getMonth() + 1;
  const ytdLeaseCost = monthlyLeaseCost * ytdMonths;

  return { months, revenueByMonth, fuelByMonth, expensesByMonth, monthlyLeaseCost, ytdRevenue, ytdFuel, ytdExpenses, ytdLeaseCost };
}

function fmt(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n.toLocaleString()}`;
}

function Row({ label, values, color = "var(--text-primary)", bold = false, indent = false, isTotal = false }: {
  label: string; values: number[]; color?: string; bold?: boolean; indent?: boolean; isTotal?: boolean;
}) {
  return (
    <tr style={{ background: isTotal ? "#f8fafc" : undefined }}>
      <td style={{
        fontSize: 12.5, fontWeight: bold ? 700 : 400, color: indent ? "var(--text-muted)" : "var(--text-primary)",
        paddingLeft: indent ? 28 : 14, borderTop: isTotal ? "2px solid var(--border)" : undefined,
        whiteSpace: "nowrap",
      }}>
        {indent && <span style={{ marginRight: 6, color: "var(--text-muted)", fontSize: 10 }}>•</span>}
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} style={{
          textAlign: "right", fontSize: 12.5, fontWeight: bold ? 700 : 400, color,
          borderTop: isTotal ? "2px solid var(--border)" : undefined,
          whiteSpace: "nowrap",
        }}>
          {v === 0 ? <span style={{ color: "var(--text-muted)" }}>—</span> : fmt(v)}
        </td>
      ))}
    </tr>
  );
}

function DividerRow({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr style={{ background: "#f1f5f9" }}>
      <td colSpan={colSpan} style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", padding: "6px 14px", letterSpacing: "0.08em" }}>
        {label}
      </td>
    </tr>
  );
}

export default async function PnLPage() {
  const session = await getSession();
  if (!session?.organizationId) return null;

  const d = await getPnLData(session.organizationId);

  // Build per-month numbers
  const monthRevenues  = d.revenueByMonth.map(r => r._sum.paidAmount ?? 0);
  const monthFuelCosts = d.fuelByMonth.map(f => f._sum.totalCost ?? 0);
  const monthLease     = d.months.map(() => d.monthlyLeaseCost);

  // Per category per month
  const catMonthly: Record<string, number[]> = {};
  EXPENSE_CATEGORIES.forEach(cat => {
    catMonthly[cat] = d.expensesByMonth.map(monthGroups => {
      const g = monthGroups.find(x => x.category === cat);
      return g?._sum?.amount ?? 0;
    });
  });

  // Total other expenses per month (all non-fuel expenses)
  const monthOtherExp = d.months.map((_, i) =>
    EXPENSE_CATEGORIES.reduce((s, cat) => s + (catMonthly[cat][i] ?? 0), 0)
  );

  const monthTotalCosts = d.months.map((_, i) =>
    monthFuelCosts[i] + monthLease[i] + monthOtherExp[i]
  );

  const monthNetProfit = d.months.map((_, i) => monthRevenues[i] - monthTotalCosts[i]);

  // YTD
  const ytdRev   = d.ytdRevenue._sum.paidAmount ?? 0;
  const ytdFuel  = d.ytdFuel._sum.totalCost ?? 0;
  const ytdLease = d.ytdLeaseCost;
  const ytdCatExp: Record<string, number> = {};
  EXPENSE_CATEGORIES.forEach(cat => {
    const g = d.ytdExpenses.find(x => x.category === cat);
    ytdCatExp[cat] = g?._sum?.amount ?? 0;
  });
  const ytdOtherExp  = EXPENSE_CATEGORIES.reduce((s, cat) => s + ytdCatExp[cat], 0);
  const ytdTotalCost = ytdFuel + ytdLease + ytdOtherExp;
  const ytdNet       = ytdRev - ytdTotalCost;

  const allCols  = d.months.length + 1; // +1 for YTD
  const numCols  = allCols + 1;         // +1 for label column

  const colLabels = [...d.months.map(m => m.label), "YTD"];
  const revValues    = [...monthRevenues, ytdRev];
  const fuelValues   = [...monthFuelCosts, ytdFuel];
  const leaseValues  = [...monthLease, ytdLease];
  const otherExpValues: Record<string, number[]> = {};
  EXPENSE_CATEGORIES.forEach(cat => {
    otherExpValues[cat] = [...(catMonthly[cat] ?? []), ytdCatExp[cat]];
  });
  const totalExpValues = [...monthTotalCosts, ytdTotalCost];
  const netValues      = [...monthNetProfit, ytdNet];

  const currentNetProfit = monthNetProfit[monthNetProfit.length - 1] ?? 0;
  const prevNetProfit    = monthNetProfit[monthNetProfit.length - 2] ?? 0;
  const netTrend = currentNetProfit - prevNetProfit;

  return (
    <div className="slide-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Link href="/reports" className="ff-btn ff-btn-ghost ff-btn-sm"><ArrowLeft size={14}/></Link>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Profit &amp; Loss Statement</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 12.5, margin: "3px 0 0" }}>
            January – {d.months[d.months.length - 1].label} {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        <div className="ff-card" style={{ padding: "12px 14px", borderLeft: "4px solid #16a34a" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>YTD Revenue</p>
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#16a34a" }}>{fmt(ytdRev)}</p>
        </div>
        <div className="ff-card" style={{ padding: "12px 14px", borderLeft: "4px solid #dc2626" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>YTD Total Costs</p>
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#dc2626" }}>{fmt(ytdTotalCost)}</p>
        </div>
        <div className="ff-card" style={{ padding: "12px 14px", borderLeft: `4px solid ${ytdNet >= 0 ? "#16a34a" : "#dc2626"}` }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>YTD Net Profit</p>
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: ytdNet >= 0 ? "#16a34a" : "#dc2626" }}>{fmt(Math.abs(ytdNet))}</p>
          <p style={{ fontSize: 10, color: ytdNet >= 0 ? "#16a34a" : "#dc2626", margin: "3px 0 0" }}>{ytdNet >= 0 ? "Profit" : "Loss"}</p>
        </div>
        <div className="ff-card" style={{ padding: "12px 14px", borderLeft: `4px solid ${netTrend >= 0 ? "#16a34a" : "#dc2626"}` }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>vs Prior Month</p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            {netTrend > 0 ? <TrendingUp size={18} color="#16a34a" /> : netTrend < 0 ? <TrendingDown size={18} color="#dc2626" /> : <Minus size={18} color="var(--text-muted)" />}
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: netTrend >= 0 ? "#16a34a" : "#dc2626" }}>
              {netTrend >= 0 ? "+" : ""}{fmt(netTrend)}
            </p>
          </div>
          <p style={{ fontSize: 10, color: "var(--text-muted)", margin: "3px 0 0" }}>net profit change</p>
        </div>
      </div>

      {/* P&L Table */}
      <div className="ff-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>Income Statement</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--border)", minWidth: 180 }}>Line Item</th>
                {colLabels.map((l, i) => (
                  <th key={i} style={{
                    textAlign: "right", padding: "10px 14px", fontSize: 11, fontWeight: 700,
                    color: i === colLabels.length - 1 ? "var(--accent)" : "var(--text-muted)",
                    borderBottom: "1px solid var(--border)", whiteSpace: "nowrap", minWidth: 110,
                    background: i === colLabels.length - 1 ? "#eff6ff" : undefined,
                  }}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <DividerRow label="REVENUE" colSpan={numCols} />
              <Row label="Sales Revenue" values={revValues} color="#16a34a" bold />

              <DividerRow label="COST OF OPERATIONS" colSpan={numCols} />
              <Row label="Fuel Costs" values={fuelValues} color="#d97706" indent />
              <Row label="Lease / Rental Costs" values={leaseValues} color="#7c3aed" indent />

              <DividerRow label="OTHER EXPENSES" colSpan={numCols} />
              {EXPENSE_CATEGORIES.filter(cat => cat !== "fuel").map(cat => (
                <Row
                  key={cat}
                  label={cat.charAt(0).toUpperCase() + cat.slice(1)}
                  values={otherExpValues[cat]}
                  color="var(--text-secondary)"
                  indent
                />
              ))}

              <Row label="Total Costs" values={totalExpValues} color="#dc2626" bold isTotal />

              <tr style={{ background: "#f0fdf4" }}>
                <td style={{ fontSize: 13.5, fontWeight: 800, padding: "12px 14px", borderTop: "3px solid #16a34a" }}>Net Profit / (Loss)</td>
                {netValues.map((v, i) => (
                  <td key={i} style={{
                    textAlign: "right", fontSize: 13.5, fontWeight: 800,
                    color: v >= 0 ? "#16a34a" : "#dc2626",
                    padding: "12px 14px", borderTop: "3px solid #16a34a",
                    background: i === netValues.length - 1 ? "#dcfce7" : undefined,
                    whiteSpace: "nowrap",
                  }}>
                    {v >= 0 ? "+" : ""}{fmt(v)}
                  </td>
                ))}
              </tr>

              {/* Margin row */}
              <tr style={{ background: "#f8fafc" }}>
                <td style={{ fontSize: 11.5, color: "var(--text-muted)", padding: "6px 14px" }}>Net Margin</td>
                {netValues.map((v, i) => {
                  const rev = revValues[i];
                  const margin = rev > 0 ? (v / rev) * 100 : 0;
                  return (
                    <td key={i} style={{
                      textAlign: "right", fontSize: 11.5, fontWeight: 600,
                      color: margin >= 0 ? "#16a34a" : "#dc2626",
                      padding: "6px 14px",
                      background: i === netValues.length - 1 ? "#f0fdf4" : undefined,
                    }}>
                      {rev > 0 ? `${margin.toFixed(1)}%` : "—"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Link href="/expenses" className="ff-btn ff-btn-secondary" style={{ fontSize: 12 }}>View Expenses →</Link>
        <Link href="/fuel" className="ff-btn ff-btn-secondary" style={{ fontSize: 12 }}>View Fuel Records →</Link>
        <Link href="/invoices" className="ff-btn ff-btn-secondary" style={{ fontSize: 12 }}>View Invoices →</Link>
      </div>
    </div>
  );
}
