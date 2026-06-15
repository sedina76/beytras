import { prisma } from "./db";

export type PlanName = "Basic" | "Professional" | "Enterprise";

export const PLAN_FEATURES: Record<PlanName, string[]> = {
  Basic: [
    "Up to 5 vehicles",
    "Dispatch management",
    "Customer management",
    "Delivery management",
    "Invoicing",
    "Basic reporting",
    "Up to 3 users",
    "Email support",
  ],
  Professional: [
    "Up to 25 vehicles",
    "Driver management",
    "Conductor management",
    "Dispatch management",
    "Customer Portal",
    "Fuel Management",
    "Maintenance Management",
    "HR & Payroll",
    "Advanced Reports",
    "Up to 15 users",
    "Priority Support",
  ],
  Enterprise: [
    "Unlimited vehicles",
    "Unlimited users",
    "Multi-branch operations",
    "Customer Portal",
    "HR & Payroll",
    "Fuel Management",
    "Maintenance Management",
    "Dispatch Management",
    "Route Management",
    "Role-based permissions",
    "API Integration Ready",
    "GPS Tracking Ready",
    "Dedicated Support",
  ],
};

export const PLAN_DEFS = [
  {
    name: "Basic" as PlanName,
    price: 6000,
    currency: "KES",
    maxVehicles: 5,
    maxDrivers: 10,
    maxUsers: 3,
    features: JSON.stringify(PLAN_FEATURES.Basic),
  },
  {
    name: "Professional" as PlanName,
    price: 12500,
    currency: "KES",
    maxVehicles: 25,
    maxDrivers: 50,
    maxUsers: 15,
    features: JSON.stringify(PLAN_FEATURES.Professional),
  },
  {
    name: "Enterprise" as PlanName,
    price: 18000,
    currency: "KES",
    maxVehicles: 9999,
    maxDrivers: 9999,
    maxUsers: 9999,
    features: JSON.stringify(PLAN_FEATURES.Enterprise),
  },
];

export async function ensurePlans(): Promise<void> {
  for (const def of PLAN_DEFS) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: def.name } });
    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: {
          price: def.price,
          currency: def.currency,
          maxVehicles: def.maxVehicles,
          maxDrivers: def.maxDrivers,
          maxUsers: def.maxUsers,
          features: def.features,
          isActive: true,
        },
      });
    } else {
      await prisma.subscriptionPlan.create({ data: def });
    }
  }
  // Deactivate legacy plan names that don't match the current set
  const validNames = PLAN_DEFS.map(p => p.name);
  await prisma.subscriptionPlan.updateMany({
    where: { name: { notIn: validNames } },
    data: { isActive: false },
  });
}

export async function getPlanByName(name: PlanName) {
  return prisma.subscriptionPlan.findFirst({ where: { name, isActive: true } });
}
