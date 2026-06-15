import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Building2, CreditCard, BarChart3, Settings, Users, HardDriveDownload } from "lucide-react";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "super_admin") redirect("/login");

  return (
    <div style={{ display:"flex",minHeight:"100vh" }}>
      {/* Super admin sidebar */}
      <aside style={{ width:220,background:"#07111f",display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0 }}>
        <div style={{ padding:"18px 16px 14px",borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#7c3aed,#5b21b6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <ShieldCheck size={18} color="#fff" />
            </div>
            <div>
              <div style={{ color:"#fff",fontWeight:700,fontSize:13 }}>FleetFlow SaaS</div>
              <div style={{ color:"rgba(255,255,255,0.35)",fontSize:10 }}>Super Admin Panel</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1,padding:"8px 0" }}>
          {[
            { href:"/admin/dashboard", icon:BarChart3, label:"Overview" },
            { href:"/admin/companies", icon:Building2, label:"Companies" },
            { href:"/admin/subscriptions", icon:CreditCard, label:"Subscriptions" },
            { href:"/admin/users", icon:Users, label:"All Users" },
            { href:"/admin/backup", icon:HardDriveDownload, label:"Backup & Restore" },
          ].map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 14px",color:"rgba(255,255,255,0.6)",textDecoration:"none",fontSize:12.5,fontWeight:500 }}>
              <Icon size={15} />{label}
            </Link>
          ))}
        </nav>
        <div style={{ padding:"10px 12px",borderTop:"1px solid rgba(255,255,255,0.06)" }}>
          <Link href="/dashboard" style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 8px",borderRadius:8,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.55)",fontSize:12,textDecoration:"none" }}>
            <Settings size={13}/> Back to App
          </Link>
        </div>
      </aside>
      <div style={{ flex:1,display:"flex",flexDirection:"column" }}>
        <header style={{ height:52,background:"#fff",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",padding:"0 20px",flexShrink:0 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <ShieldCheck size={16} color="#7c3aed" />
            <span style={{ fontSize:13,fontWeight:700,color:"var(--text-primary)" }}>Super Admin</span>
            <span style={{ fontSize:12,color:"var(--text-muted)" }}>— {session.email}</span>
          </div>
        </header>
        <main style={{ flex:1,padding:20,overflowX:"hidden" }}>{children}</main>
      </div>
    </div>
  );
}
