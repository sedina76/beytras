"use client";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header />
        <main style={{ flex: 1, overflowY: "auto", padding: "14px 18px 24px", background: "var(--background)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
