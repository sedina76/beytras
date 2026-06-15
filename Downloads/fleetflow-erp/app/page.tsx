import PageShell from "@/components/PageShell";
import KpiRow from "@/components/KpiRow";
import TankerMap from "@/components/TankerMap";
import RecentDeliveries from "@/components/RecentDeliveries";
import TankerUtilization from "@/components/TankerUtilization";
import TopCustomers from "@/components/TopCustomers";
import RevenueChart from "@/components/RevenueChart";
import { DriverAppPreview, CustomerAppPreview } from "@/components/MobilePreview";
import BottomSections from "@/components/BottomSections";
import { Home, ChevronRight } from "lucide-react";

export default function Dashboard() {
  return (
    <PageShell>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
            <Home size={11} />
            <span>Home</span>
            <ChevronRight size={10} />
            <span style={{ color: "var(--accent)" }}>Dashboard</span>
          </div>
        </div>
      </div>
      <KpiRow />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px 200px", gap: 10, marginBottom: 14 }}>
        <TankerMap />
        <RecentDeliveries />
        <TankerUtilization />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 14, alignItems: "start" }}>
        <TopCustomers />
        <RevenueChart />
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <DriverAppPreview />
          <CustomerAppPreview />
        </div>
      </div>
      <BottomSections />
    </PageShell>
  );
}
