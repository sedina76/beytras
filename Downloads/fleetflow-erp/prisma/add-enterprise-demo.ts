import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Enterprise plan ───────────────────────────────────────────────────────
  const enterprise = await prisma.subscriptionPlan.upsert({
    where: { id: "plan_enterprise" },
    update: {},
    create: {
      id: "plan_enterprise",
      name: "Enterprise",
      price: 599,
      maxVehicles: 9999,
      maxDrivers: 9999,
      maxUsers: 9999,
      features: JSON.stringify([
        "Unlimited vehicles", "Unlimited drivers", "Custom integrations",
        "Dedicated support", "SLA guarantee", "Multi-branch", "Custom reports",
      ]),
    },
  });

  // ── Organisation ──────────────────────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "transafrica-logistics" },
    update: {},
    create: {
      name: "TransAfrica Logistics Ltd",
      slug: "transafrica-logistics",
      email: "info@transafrica.co.ke",
      phone: "+254 711 900 000",
      address: "Mombasa Road, Industrial Area, Nairobi",
      city: "Nairobi",
      status: "active",
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      planId: enterprise.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.companySettings.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      currency: "KES",
      timezone: "Africa/Nairobi",
      emailEnabled: true,
      whatsappEnabled: true,
      smsEnabled: true,
      invoicePrefix: "TAL",
      orderPrefix: "TAL",
    },
  });

  // ── Staff ─────────────────────────────────────────────────────────────────
  const users = [
    { email: "admin@transafrica.co.ke",    password: "Admin@456",    name: "Michael Odhiambo",  role: "company_admin",    salary: 250000, phone: "+254 711 900 001" },
    { email: "dispatch@transafrica.co.ke", password: "Dispatch@456", name: "Alice Njeri",        role: "dispatcher",       salary: 85000,  phone: "+254 711 900 002" },
    { email: "accounts@transafrica.co.ke", password: "Accounts@456", name: "Brian Kiprotich",    role: "accountant",       salary: 110000, phone: "+254 711 900 003" },
    { email: "mechanic@transafrica.co.ke", password: "Mechanic@456", name: "Samuel Mwenda",      role: "mechanic",         salary: 75000,  phone: "+254 711 900 004" },
    { email: "support@transafrica.co.ke",  password: "Support@456",  name: "Diana Achieng",      role: "customer_support", salary: 65000,  phone: "+254 711 900 005" },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        organizationId: org.id,
        email: u.email,
        passwordHash: hash,
        name: u.name,
        phone: u.phone,
        role: u.role,
        monthlySalary: u.salary,
        isActive: true,
      },
    });
    console.log(`  ✅  ${u.role.padEnd(20)} ${u.email}  /  ${u.password}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏢  Enterprise Company: TransAfrica Logistics Ltd");
  console.log("    Plan: Enterprise (unlimited vehicles, drivers, users)");
  console.log("    Login at: /login");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
