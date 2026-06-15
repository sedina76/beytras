import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

const ORG_ID = "cmqb8favt0001kfpj2hw8kmr7"; // AquaFlow Solutions Ltd

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const expenses = [
  // Fuel
  { category: "fuel", description: "Diesel fuel refill — KCA 234B", amount: 12500, vendor: "TotalEnergies Thika Rd", date: daysAgo(2), approvedBy: "James Mwangi" },
  { category: "fuel", description: "Diesel fuel refill — KDA 567C", amount: 11200, vendor: "Rubis Mombasa Rd", date: daysAgo(5), approvedBy: "James Mwangi" },
  { category: "fuel", description: "Diesel fuel refill — KBB 890D", amount: 13800, vendor: "TotalEnergies Ngong Rd", date: daysAgo(9), approvedBy: "James Mwangi" },
  { category: "fuel", description: "Diesel fuel refill — KCA 234B", amount: 12000, vendor: "Shell Westlands", date: daysAgo(14), approvedBy: "James Mwangi" },
  { category: "fuel", description: "Diesel fuel refill — KDA 567C", amount: 10800, vendor: "Rubis Karen", date: daysAgo(18), approvedBy: "James Mwangi" },
  { category: "fuel", description: "Diesel fuel refill — KBB 890D", amount: 14200, vendor: "TotalEnergies Thika Rd", date: daysAgo(25), approvedBy: "James Mwangi" },

  // Maintenance
  { category: "maintenance", description: "Oil change & filter — KCA 234B", amount: 8500, vendor: "Jubilee Motors Nairobi", date: daysAgo(3), approvedBy: "Grace Njoroge" },
  { category: "maintenance", description: "Tyre replacement x4 — KDA 567C", amount: 48000, vendor: "Sameer Tyres", date: daysAgo(7), approvedBy: "Grace Njoroge" },
  { category: "maintenance", description: "Brake pad replacement — KBB 890D", amount: 15000, vendor: "Jubilee Motors Nairobi", date: daysAgo(12), approvedBy: "Grace Njoroge" },
  { category: "maintenance", description: "Full service — KCA 234B", amount: 22000, vendor: "Toyota Kenya Mombasa Rd", date: daysAgo(30), approvedBy: "Grace Njoroge" },
  { category: "maintenance", description: "Windscreen replacement — KDA 567C", amount: 35000, vendor: "Glass Care Ltd", date: daysAgo(40), approvedBy: "Grace Njoroge" },

  // Salary
  { category: "salary", description: "Driver salaries — May 2026", amount: 180000, vendor: null, date: daysAgo(43), approvedBy: "CEO" },
  { category: "salary", description: "Support staff salaries — May 2026", amount: 120000, vendor: null, date: daysAgo(43), approvedBy: "CEO" },
  { category: "salary", description: "Driver salaries — April 2026", amount: 180000, vendor: null, date: daysAgo(74), approvedBy: "CEO" },
  { category: "salary", description: "Support staff salaries — April 2026", amount: 120000, vendor: null, date: daysAgo(74), approvedBy: "CEO" },

  // Insurance
  { category: "insurance", description: "Fleet comprehensive insurance — Q2 2026", amount: 95000, vendor: "Jubilee Insurance", date: daysAgo(60), approvedBy: "CEO" },
  { category: "insurance", description: "Goods-in-transit cover renewal", amount: 28000, vendor: "CIC Insurance", date: daysAgo(45), approvedBy: "CEO" },
  { category: "insurance", description: "Driver personal accident policy", amount: 18500, vendor: "AAR Insurance", date: daysAgo(45), approvedBy: "CEO" },

  // License
  { category: "license", description: "NTSA vehicle inspection — KCA 234B", amount: 3200, vendor: "NTSA", date: daysAgo(20), approvedBy: "Grace Njoroge" },
  { category: "license", description: "NTSA vehicle inspection — KDA 567C", amount: 3200, vendor: "NTSA", date: daysAgo(20), approvedBy: "Grace Njoroge" },
  { category: "license", description: "Tanker operator permit renewal", amount: 12000, vendor: "EPRA", date: daysAgo(50), approvedBy: "CEO" },
  { category: "license", description: "Business permit renewal 2026", amount: 8500, vendor: "Nairobi City County", date: daysAgo(90), approvedBy: "CEO" },

  // Office
  { category: "office", description: "Office rent — June 2026", amount: 45000, vendor: "Synergy Properties", date: daysAgo(1), approvedBy: "CEO" },
  { category: "office", description: "Office rent — May 2026", amount: 45000, vendor: "Synergy Properties", date: daysAgo(31), approvedBy: "CEO" },
  { category: "office", description: "Internet & telephone bill — May", amount: 7800, vendor: "Safaricom Business", date: daysAgo(33), approvedBy: "Grace Njoroge" },
  { category: "office", description: "Office supplies & stationery", amount: 3500, vendor: "Silverbird Stationery", date: daysAgo(15), approvedBy: "Grace Njoroge" },
  { category: "office", description: "Internet & telephone bill — June", amount: 7800, vendor: "Safaricom Business", date: daysAgo(3), approvedBy: "Grace Njoroge" },

  // Other
  { category: "other", description: "Bank charges — May 2026", amount: 1200, vendor: "KCB Bank", date: daysAgo(32), approvedBy: null },
  { category: "other", description: "Vehicle tracker subscription — 3 units", amount: 9000, vendor: "Goldensun Tracking", date: daysAgo(10), approvedBy: "Grace Njoroge" },
  { category: "other", description: "Employee training — defensive driving", amount: 24000, vendor: "AA Kenya", date: daysAgo(55), approvedBy: "CEO" },
  { category: "other", description: "Bank charges — June 2026", amount: 1200, vendor: "KCB Bank", date: daysAgo(2), approvedBy: null },
];

async function main() {
  let count = 0;
  for (const e of expenses) {
    await prisma.expense.create({
      data: { organizationId: ORG_ID, ...e },
    });
    count++;
  }
  console.log(`✓ Seeded ${count} expenses`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
