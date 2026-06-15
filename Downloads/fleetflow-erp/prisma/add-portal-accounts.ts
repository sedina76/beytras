import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // List all customers
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true, email: true, organizationId: true },
    orderBy: { name: "asc" },
  });

  console.log(`Found ${customers.length} customers:`);
  customers.forEach((c, i) => console.log(`  ${i + 1}. [${c.id}] ${c.name} — ${c.email ?? "no email"}`));

  if (customers.length === 0) {
    console.log("No customers found — run the main seed first.");
    return;
  }

  // Give portal access to up to 3 customers
  const targets = customers.slice(0, 3);
  const credentials = [
    { password: "Customer@123", suffix: "one" },
    { password: "Customer@234", suffix: "two" },
    { password: "Customer@345", suffix: "three" },
  ];

  console.log("\nCreating portal accounts...");
  for (let i = 0; i < targets.length; i++) {
    const c = targets[i];
    const cred = credentials[i];
    // Use customer's existing email if available, otherwise generate one
    const portalEmail = c.email ?? `portal.${cred.suffix}@aquaflow.co.ke`;

    const existing = await prisma.customerPortalAccount.findUnique({ where: { customerId: c.id } });
    if (existing) {
      console.log(`  ⚠️  ${c.name} already has a portal account (${existing.email}) — skipping`);
      continue;
    }

    // Check email uniqueness
    const emailConflict = await prisma.customerPortalAccount.findUnique({ where: { email: portalEmail } });
    const finalEmail = emailConflict ? `portal.${cred.suffix}@aquaflow.co.ke` : portalEmail;

    const hash = await bcrypt.hash(cred.password, 12);
    await prisma.customerPortalAccount.create({
      data: {
        organizationId: c.organizationId,
        customerId: c.id,
        email: finalEmail,
        passwordHash: hash,
        isActive: true,
      },
    });
    console.log(`  ✅  ${c.name}  →  ${finalEmail}  /  ${cred.password}`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏢  Customer Portal login  →  /customer-login");
  const accounts = await prisma.customerPortalAccount.findMany({
    include: { customer: { select: { name: true } } },
  });
  accounts.forEach(a => {
    console.log(`   ${a.customer.name.padEnd(32)} ${a.email}`);
  });
  console.log("   Password hints printed above during creation.");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
