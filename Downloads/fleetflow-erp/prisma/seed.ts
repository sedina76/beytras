import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding FleetFlow ERP database...");

  // ── Subscription Plans ───────────────────────────────────────────────────────
  const starter = await prisma.subscriptionPlan.upsert({
    where: { id: "plan_starter" },
    update: {},
    create: {
      id: "plan_starter",
      name: "Starter",
      price: 99,
      maxVehicles: 5,
      maxDrivers: 10,
      maxUsers: 5,
      features: JSON.stringify(["Up to 5 vehicles", "Up to 10 drivers", "Basic dispatch", "Order management", "Invoice generation"]),
    },
  });

  const professional = await prisma.subscriptionPlan.upsert({
    where: { id: "plan_professional" },
    update: {},
    create: {
      id: "plan_professional",
      name: "Professional",
      price: 249,
      maxVehicles: 25,
      maxDrivers: 50,
      maxUsers: 20,
      features: JSON.stringify(["Up to 25 vehicles", "Up to 50 drivers", "GPS tracking", "Customer portal", "Fuel management", "Advanced reports", "WhatsApp notifications"]),
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { id: "plan_enterprise" },
    update: {},
    create: {
      id: "plan_enterprise",
      name: "Enterprise",
      price: 599,
      maxVehicles: 9999,
      maxDrivers: 9999,
      maxUsers: 9999,
      features: JSON.stringify(["Unlimited vehicles", "Unlimited drivers", "Custom integrations", "Dedicated support", "SLA guarantee", "Multi-branch", "Custom reports"]),
    },
  });

  // ── Super Admin ──────────────────────────────────────────────────────────────
  const superAdminHash = await bcrypt.hash("Super@123", 12);
  await prisma.user.upsert({
    where: { email: "superadmin@fleetflow.io" },
    update: {},
    create: {
      email: "superadmin@fleetflow.io",
      passwordHash: superAdminHash,
      name: "FleetFlow Super Admin",
      role: "super_admin",
      organizationId: null,
    },
  });

  // ── Demo Company: AquaFlow Solutions ────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: "aquaflow-solutions" },
    update: {},
    create: {
      name: "AquaFlow Solutions Ltd",
      slug: "aquaflow-solutions",
      email: "info@aquaflow.co.ke",
      phone: "+254 700 123 456",
      address: "Industrial Area, Nairobi",
      city: "Nairobi",
      status: "active",
    },
  });

  await prisma.subscription.upsert({
    where: { organizationId: org.id },
    update: {},
    create: {
      organizationId: org.id,
      planId: professional.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
      invoicePrefix: "INV",
      orderPrefix: "ORD",
    },
  });

  // ── Staff Accounts ───────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash("Admin@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@aquaflow.co.ke" },
    update: {},
    create: {
      organizationId: org.id,
      email: "admin@aquaflow.co.ke",
      passwordHash: adminHash,
      name: "James Mwangi",
      phone: "+254 721 000 001",
      role: "company_admin",
      monthlySalary: 180000,
    },
  });

  const dispatcherHash = await bcrypt.hash("Dispatch@123", 12);
  await prisma.user.upsert({
    where: { email: "dispatch@aquaflow.co.ke" },
    update: {},
    create: {
      organizationId: org.id,
      email: "dispatch@aquaflow.co.ke",
      passwordHash: dispatcherHash,
      name: "Sarah Otieno",
      role: "dispatcher",
      monthlySalary: 75000,
    },
  });

  const accountantHash = await bcrypt.hash("Accounts@123", 12);
  await prisma.user.upsert({
    where: { email: "accounts@aquaflow.co.ke" },
    update: {},
    create: {
      organizationId: org.id,
      email: "accounts@aquaflow.co.ke",
      passwordHash: accountantHash,
      name: "Grace Wambui",
      role: "accountant",
      monthlySalary: 90000,
    },
  });

  const mechanicHash = await bcrypt.hash("Mechanic@123", 12);
  await prisma.user.upsert({
    where: { email: "mechanic@aquaflow.co.ke" },
    update: {},
    create: {
      organizationId: org.id,
      email: "mechanic@aquaflow.co.ke",
      passwordHash: mechanicHash,
      name: "Robert Maina",
      role: "mechanic",
      monthlySalary: 65000,
    },
  });

  // ── Drivers ──────────────────────────────────────────────────────────────────
  const driverData = [
    { name: "John Kamau Njoroge",   phone: "+254 712 100 001", license: "DL0001234", email: "driver1@aquaflow.co.ke", tripRate: 2500, dayRate: 0, payType: "per_trip" },
    { name: "Peter Ochieng Ouma",   phone: "+254 712 100 002", license: "DL0002345", email: "driver2@aquaflow.co.ke", tripRate: 2500, dayRate: 0, payType: "per_trip" },
    { name: "Moses Wekesa Simiyu",  phone: "+254 712 100 003", license: "DL0003456", email: "driver3@aquaflow.co.ke", tripRate: 0, dayRate: 3000, payType: "per_day" },
    { name: "Charles Mutua Ndolo",  phone: "+254 712 100 004", license: "DL0004567", email: "driver4@aquaflow.co.ke", tripRate: 2000, dayRate: 2800, payType: "both" },
    { name: "David Kipchoge Kimani",phone: "+254 712 100 005", license: "DL0005678", email: null, tripRate: 2200, dayRate: 0, payType: "per_trip" },
  ];

  const driverHash = await bcrypt.hash("Driver@123", 12);
  const drivers = [];

  for (const d of driverData) {
    let userId: string | undefined;
    if (d.email) {
      const user = await prisma.user.upsert({
        where: { email: d.email },
        update: {},
        create: {
          organizationId: org.id,
          email: d.email,
          passwordHash: driverHash,
          name: d.name,
          phone: d.phone,
          role: "driver",
        },
      });
      userId = user.id;
    }

    const driverId = "driver_" + d.license;
    const driver = await prisma.driver.upsert({
      where: { id: driverId },
      update: {},
      create: {
        id: driverId,
        organizationId: org.id,
        name: d.name,
        phone: d.phone,
        email: d.email,
        licenseNumber: d.license,
        licenseExpiry: new Date("2027-06-30"),
        userId: userId || null,
        status: "available",
        rating: 4.3 + Math.random() * 0.7,
        totalTrips: Math.floor(Math.random() * 200) + 50,
      },
    });
    drivers.push(driver);

    await prisma.driverPayRate.upsert({
      where: { driverId: driver.id },
      update: {},
      create: {
        organizationId: org.id,
        driverId: driver.id,
        payType: d.payType,
        perTripRate: d.tripRate,
        perDayRate: d.dayRate,
      },
    });
  }

  // ── Vehicles ─────────────────────────────────────────────────────────────────
  const vehicleData = [
    { plate: "KCA 001A", make: "Isuzu",      model: "FVR 34P",     year: 2020, capacity: 10000, odometer: 62400 },
    { plate: "KCA 002B", make: "Isuzu",      model: "FTS 800",     year: 2019, capacity:  8000, odometer: 81200 },
    { plate: "KCB 003C", make: "Mitsubishi", model: "Fuso FJ",     year: 2021, capacity: 15000, odometer: 44800 },
    { plate: "KCC 004D", make: "Mercedes",   model: "Actros 2644", year: 2022, capacity: 20000, odometer: 28600 },
    { plate: "KCD 005E", make: "MAN",        model: "TGS 18.440",  year: 2020, capacity: 18000, odometer: 55300 },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const vid = "vehicle_" + v.plate.replace(/\s/g, "");
    const vehicle = await prisma.vehicle.upsert({
      where: { id: vid },
      update: {},
      create: {
        id: vid,
        organizationId: org.id,
        plateNumber: v.plate,
        make: v.make,
        model: v.model,
        year: v.year,
        capacityLitres: v.capacity,
        fuelType: "diesel",
        color: "White",
        status: "available",
        odometerKm: v.odometer,
      },
    });
    vehicles.push(vehicle);
  }

  // ── Water Sources ─────────────────────────────────────────────────────────────
  const waterSourceData = [
    { id: "ws_01", name: "Nairobi City Water Works — Industrial",  address: "Enterprise Rd, Industrial Area, Nairobi", lat: -1.3100, lng: 36.8450, notes: "Main depot. Open 6 am–6 pm weekdays." },
    { id: "ws_02", name: "Ruai Water Treatment Plant",             address: "Eastern Bypass, Ruai, Nairobi",          lat: -1.2710, lng: 36.9500, notes: "24-hour access for commercial tankers." },
    { id: "ws_03", name: "Gigiri Borehole Station",                address: "United Nations Ave, Gigiri, Nairobi",    lat: -1.2280, lng: 36.8040, notes: "Good pressure. Queue expected mornings." },
    { id: "ws_04", name: "Karen Water Depot",                      address: "Ngong Rd, Karen, Nairobi",               lat: -1.3300, lng: 36.7100, notes: "Serves Langata and Karen corridor." },
    { id: "ws_05", name: "Thika Road Water Hub",                   address: "Thika Superhighway, Kasarani, Nairobi",  lat: -1.2160, lng: 36.8960, notes: "Refuelling and water — 24 hrs." },
  ];

  for (const ws of waterSourceData) {
    await prisma.waterSource.upsert({
      where: { id: ws.id },
      update: {},
      create: { organizationId: org.id, ...ws },
    });
  }

  // ── Inventory ─────────────────────────────────────────────────────────────────
  const inventoryData = [
    { id: "inv_item_01", name: "Engine Oil 15W-40 (20L)",        category: "oil",        sku: "OIL-15W40-20L", quantity: 24, reorderLevel: 10, unitCost: 4500, supplier: "Total Energies Kenya", location: "Store Room A" },
    { id: "inv_item_02", name: "Oil Filter — Isuzu FVR",         category: "filter",     sku: "FLT-ISZ-OIL",  quantity: 18, reorderLevel:  8, unitCost:  850, supplier: "Isuzu Kenya Ltd",      location: "Store Room A" },
    { id: "inv_item_03", name: "Air Filter — Isuzu FTS",         category: "filter",     sku: "FLT-ISZ-AIR",  quantity: 12, reorderLevel:  6, unitCost: 1200, supplier: "Isuzu Kenya Ltd",      location: "Store Room A" },
    { id: "inv_item_04", name: "Truck Tyre 11R22.5 (Radial)",    category: "tire",       sku: "TYR-11R225",   quantity:  8, reorderLevel:  4, unitCost: 22000, supplier: "Tyre King Nairobi",  location: "Tyre Bay" },
    { id: "inv_item_05", name: "Brake Pads — Heavy Duty",        category: "spare_part", sku: "BRK-HD-001",   quantity:  6, reorderLevel:  3, unitCost: 8500, supplier: "Toyota Kenya",         location: "Store Room B" },
    { id: "inv_item_06", name: "Water Hose 3\" x 6m",            category: "hose",       sku: "HSE-3IN-6M",   quantity: 10, reorderLevel:  4, unitCost: 3200, supplier: "AquaSupplies Ltd",    location: "Store Room B" },
    { id: "inv_item_07", name: "Submersible Pump 5HP",           category: "pump",       sku: "PMP-SUB-5HP",  quantity:  3, reorderLevel:  2, unitCost: 85000, supplier: "Grundfos Kenya",     location: "Equipment Bay" },
    { id: "inv_item_08", name: "Fuel Filter — Universal",        category: "filter",     sku: "FLT-FUEL-UNI", quantity: 20, reorderLevel:  8, unitCost:  650, supplier: "Car & General",        location: "Store Room A" },
    { id: "inv_item_09", name: "V-Belt Set (Fan)",               category: "spare_part", sku: "BLT-FAN-001",  quantity: 15, reorderLevel:  5, unitCost: 1800, supplier: "Automax Garage",       location: "Store Room A" },
    { id: "inv_item_10", name: "Truck Battery 200AH",            category: "other",      sku: "BAT-200AH",    quantity:  4, reorderLevel:  2, unitCost: 18500, supplier: "Car & General",       location: "Store Room B" },
  ];

  for (const item of inventoryData) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: { organizationId: org.id, ...item },
    });
  }

  // ── Customers ─────────────────────────────────────────────────────────────────
  const customerData = [
    { id: "cust_01", name: "Serena Hotel & Spa Nairobi",  phone: "+254 20 422 2000",  email: "procurement@serena.co.ke",     city: "Nairobi", address: "Kenyatta Ave, Nairobi CBD",         type: "business", creditLimit: 500000, balance: 48000  },
    { id: "cust_02", name: "Nairobi Hospital",            phone: "+254 20 284 0000",  email: "stores@nairobihospital.co.ke", city: "Nairobi", address: "Argwings Kodhek Rd, Hurlingham",    type: "business", creditLimit: 300000, balance: 0      },
    { id: "cust_03", name: "Tatu City Apartments",        phone: "+254 700 000 111",  email: "facilities@tatucity.co.ke",    city: "Ruiru",   address: "Tatu City, Kiambu Road",            type: "business", creditLimit: 200000, balance: 22500  },
    { id: "cust_04", name: "Equity Bank HQ",              phone: "+254 763 063 000",  email: "facilities@equity.co.ke",      city: "Nairobi", address: "Equity Centre, Upperhill",          type: "business", creditLimit: 400000, balance: 0      },
    { id: "cust_05", name: "Kenya Breweries Ltd",         phone: "+254 20 380 3000",  email: "logistics@kbl.co.ke",          city: "Nairobi", address: "Mombasa Road, Nairobi",             type: "business", creditLimit: 600000, balance: 75000  },
    { id: "cust_06", name: "Brookside Dairy",             phone: "+254 722 204 490",  email: "operations@brookside.co.ke",   city: "Ruiru",   address: "Ruiru, Kiambu",                     type: "business", creditLimit: 250000, balance: 0      },
    { id: "cust_07", name: "Quickmart Supermarkets",      phone: "+254 720 320 000",  email: "supply@quickmart.co.ke",       city: "Nairobi", address: "Westlands, Nairobi",                type: "business", creditLimit: 350000, balance: 31000  },
    { id: "cust_08", name: "Vision 2030 Towers",          phone: "+254 733 111 222",  email: "fm@v2030towers.co.ke",         city: "Nairobi", address: "Upper Hill, Nairobi",               type: "business", creditLimit: 150000, balance: 0      },
    { id: "cust_09", name: "Kenyatta National Hospital",  phone: "+254 20 272 6300",  email: "pharmacy@knh.co.ke",           city: "Nairobi", address: "Hospital Rd, Nairobi",              type: "business", creditLimit: 500000, balance: 12000  },
    { id: "cust_10", name: "Athena Construction Ltd",     phone: "+254 722 888 444",  email: "site@athena.co.ke",            city: "Machakos",address: "Mlolongo, Machakos",                type: "business", creditLimit: 1000000,balance: 180000 },
  ];

  const customers = [];
  for (const c of customerData) {
    const customer = await prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: { organizationId: org.id, status: "active", ...c },
    });
    customers.push(customer);
  }

  // ── Customer Portal Accounts ──────────────────────────────────────────────────
  // Give 3 customers portal access for demo purposes
  const portalAccounts = [
    { customerId: "cust_01", email: "portal.serena@demo.com",    password: "Serena@123"   },
    { customerId: "cust_02", email: "portal.hospital@demo.com",  password: "Hospital@123" },
    { customerId: "cust_05", email: "portal.kbl@demo.com",       password: "Kbl@1234"     },
  ];

  for (const pa of portalAccounts) {
    const existing = await prisma.customerPortalAccount.findUnique({ where: { customerId: pa.customerId } });
    if (!existing) {
      const hash = await bcrypt.hash(pa.password, 12);
      await prisma.customerPortalAccount.create({
        data: {
          organizationId: org.id,
          customerId: pa.customerId,
          email: pa.email,
          passwordHash: hash,
          isActive: true,
        },
      });
    }
  }

  // ── Orders ────────────────────────────────────────────────────────────────────
  const orderRows = [
    { cust: "cust_01", product: "water", qty: 8000,  unit: "litres", amount: 24000, status: "delivered",  priority: "normal", daysAgo: 28 },
    { cust: "cust_01", product: "water", qty: 8000,  unit: "litres", amount: 24000, status: "delivered",  priority: "normal", daysAgo: 14 },
    { cust: "cust_01", product: "water", qty: 10000, unit: "litres", amount: 30000, status: "pending",    priority: "high",   daysAgo: 1  },
    { cust: "cust_02", product: "water", qty: 5000,  unit: "litres", amount: 15000, status: "delivered",  priority: "normal", daysAgo: 20 },
    { cust: "cust_02", product: "water", qty: 5000,  unit: "litres", amount: 15000, status: "dispatched", priority: "urgent", daysAgo: 0  },
    { cust: "cust_03", product: "water", qty: 15000, unit: "litres", amount: 45000, status: "delivered",  priority: "normal", daysAgo: 18 },
    { cust: "cust_03", product: "water", qty: 15000, unit: "litres", amount: 45000, status: "delivered",  priority: "normal", daysAgo: 4  },
    { cust: "cust_04", product: "water", qty: 3000,  unit: "litres", amount:  9000, status: "delivered",  priority: "low",    daysAgo: 25 },
    { cust: "cust_05", product: "water", qty: 20000, unit: "litres", amount: 60000, status: "delivered",  priority: "high",   daysAgo: 22 },
    { cust: "cust_05", product: "water", qty: 20000, unit: "litres", amount: 60000, status: "in_progress",priority: "high",   daysAgo: 0  },
    { cust: "cust_06", product: "water", qty: 8000,  unit: "litres", amount: 24000, status: "delivered",  priority: "normal", daysAgo: 10 },
    { cust: "cust_07", product: "water", qty: 6000,  unit: "litres", amount: 18000, status: "delivered",  priority: "normal", daysAgo: 16 },
    { cust: "cust_07", product: "water", qty: 6000,  unit: "litres", amount: 18000, status: "cancelled",  priority: "normal", daysAgo: 8  },
    { cust: "cust_08", product: "water", qty: 4000,  unit: "litres", amount: 12000, status: "delivered",  priority: "normal", daysAgo: 30 },
    { cust: "cust_09", product: "water", qty: 10000, unit: "litres", amount: 30000, status: "delivered",  priority: "high",   daysAgo: 12 },
    { cust: "cust_09", product: "water", qty: 10000, unit: "litres", amount: 30000, status: "pending",    priority: "normal", daysAgo: 0  },
    { cust: "cust_10", product: "water", qty: 25000, unit: "litres", amount: 75000, status: "delivered",  priority: "urgent", daysAgo: 6  },
    { cust: "cust_10", product: "water", qty: 25000, unit: "litres", amount: 75000, status: "delivered",  priority: "urgent", daysAgo: 3  },
    { cust: "cust_10", product: "water", qty: 30000, unit: "litres", amount: 90000, status: "dispatched", priority: "urgent", daysAgo: 0  },
    { cust: "cust_06", product: "water", qty: 8000,  unit: "litres", amount: 24000, status: "delivered",  priority: "normal", daysAgo: 35 },
  ];

  const createdOrders: { id: string; customerId: string; status: string; driverIdx: number; vehicleIdx: number }[] = [];

  for (let i = 0; i < orderRows.length; i++) {
    const row = orderRows[i];
    const orderId = `order_demo_${String(i + 1).padStart(3, "0")}`;
    const orderNumber = `ORD-${String(i + 1).padStart(5, "0")}`;
    const createdAt = new Date(Date.now() - row.daysAgo * 24 * 60 * 60 * 1000);
    const customer = customers.find(c => c.id === row.cust)!;

    await prisma.order.upsert({
      where: { id: orderId },
      update: {},
      create: {
        id: orderId,
        organizationId: org.id,
        customerId: customer.id,
        orderNumber,
        productType: row.product,
        quantityOrdered: row.qty,
        unit: row.unit,
        deliveryAddress: customer.address,
        priority: row.priority,
        status: row.status,
        totalAmount: row.amount,
        type: "delivery",
        createdAt,
        updatedAt: createdAt,
        scheduledAt: null,
        notes: null,
      },
    });

    createdOrders.push({ id: orderId, customerId: customer.id, status: row.status, driverIdx: i % drivers.length, vehicleIdx: i % vehicles.length });
  }

  // ── Dispatch Jobs ─────────────────────────────────────────────────────────────
  for (const o of createdOrders) {
    const needsDriver = !["pending", "cancelled"].includes(o.status);
    const jobStatus =
      o.status === "delivered"   ? "delivered" :
      o.status === "dispatched"  ? "en_route_customer" :
      o.status === "in_progress" ? "loaded" :
      o.status === "cancelled"   ? "cancelled" : "unassigned";

    await prisma.dispatchJob.upsert({
      where: { orderId: o.id },
      update: {},
      create: {
        organizationId: org.id,
        orderId: o.id,
        driverId:  needsDriver ? drivers[o.driverIdx].id  : null,
        vehicleId: needsDriver ? vehicles[o.vehicleIdx].id : null,
        status: jobStatus,
        assignedAt:  needsDriver ? new Date(Date.now() - 2 * 3600 * 1000) : null,
        completedAt: o.status === "delivered" ? new Date(Date.now() - 3600 * 1000) : null,
      },
    });
  }

  // ── Fuel Records ──────────────────────────────────────────────────────────────
  const fuelStations = ["Total Mombasa Rd", "Shell Karen", "Rubis Westlands", "OilLibya Industrial Area", "Kobil Thika Rd"];
  for (let i = 0; i < 20; i++) {
    const vehicle = vehicles[i % vehicles.length];
    const litres = [60, 80, 100, 75, 120][i % 5];
    const costPerLitre = 154 + (i % 6);
    await prisma.fuelRecord.upsert({
      where: { id: `fuel_demo_${i}` },
      update: {},
      create: {
        id: `fuel_demo_${i}`,
        organizationId: org.id,
        vehicleId: vehicle.id,
        litres,
        costPerLitre,
        totalCost: litres * costPerLitre,
        odometerKm: vehicle.odometerKm - (20 - i) * 800,
        station: fuelStations[i % fuelStations.length],
        date: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ── Invoices ──────────────────────────────────────────────────────────────────
  const invoiceData = [
    { cust: "cust_01", subtotal: 48000, status: "paid",    daysAgo: 40, dueDelta:  14 },
    { cust: "cust_02", subtotal: 30000, status: "paid",    daysAgo: 35, dueDelta:  14 },
    { cust: "cust_03", subtotal: 90000, status: "paid",    daysAgo: 30, dueDelta:  14 },
    { cust: "cust_04", subtotal: 18000, status: "paid",    daysAgo: 25, dueDelta:  14 },
    { cust: "cust_05", subtotal: 60000, status: "sent",    daysAgo: 18, dueDelta:  30 },
    { cust: "cust_06", subtotal: 24000, status: "sent",    daysAgo: 12, dueDelta:  30 },
    { cust: "cust_07", subtotal: 36000, status: "sent",    daysAgo:  8, dueDelta:  30 },
    { cust: "cust_09", subtotal: 30000, status: "overdue", daysAgo: 45, dueDelta: -5  },
    { cust: "cust_10", subtotal: 165000,status: "sent",    daysAgo:  5, dueDelta:  25 },
    { cust: "cust_01", subtotal: 24000, status: "draft",   daysAgo:  1, dueDelta:  30 },
  ];

  for (let i = 0; i < invoiceData.length; i++) {
    const row = invoiceData[i];
    const invId = `inv_demo_${i}`;
    const customer = customers.find(c => c.id === row.cust)!;
    const taxRate = 16;
    const taxAmount = (row.subtotal * taxRate) / 100;
    const total = row.subtotal + taxAmount;
    const isPaid = row.status === "paid";
    const createdAt = new Date(Date.now() - row.daysAgo * 24 * 60 * 60 * 1000);
    const dueDate = new Date(createdAt.getTime() + row.dueDelta * 24 * 60 * 60 * 1000);

    await prisma.invoice.upsert({
      where: { id: invId },
      update: {},
      create: {
        id: invId,
        organizationId: org.id,
        customerId: customer.id,
        invoiceNumber: `INV-${String(i + 1).padStart(5, "0")}`,
        subtotal: row.subtotal,
        taxRate,
        taxAmount,
        totalAmount: total,
        paidAmount: isPaid ? total : 0,
        status: row.status,
        dueDate,
        createdAt,
        updatedAt: createdAt,
        notes: null,
        orderId: null,
      },
    });

    if (isPaid) {
      await prisma.payment.upsert({
        where: { id: `pay_demo_${i}` },
        update: {},
        create: {
          id: `pay_demo_${i}`,
          organizationId: org.id,
          invoiceId: invId,
          amount: total,
          method: ["mpesa", "bank_transfer", "cash", "cheque"][i % 4],
          reference: `REF-AQ-${String(Date.now() + i).slice(-8)}`,
          paidAt: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ── Maintenance ───────────────────────────────────────────────────────────────
  const maintData = [
    { vehicle: 0, type: "service",    desc: "Full service — oil, filters, belts",   cost: 25000, vendor: "Toyota Kenya",       status: "completed", daysAgo: 60, nextKm: 70000 },
    { vehicle: 1, type: "repair",     desc: "Brake pad replacement — front axle",   cost: 18000, vendor: "Isuzu Kenya",         status: "completed", daysAgo: 45, nextKm: 90000 },
    { vehicle: 2, type: "inspection", desc: "Annual roadworthiness inspection",     cost:  8000, vendor: "NTSA Inspection Bay", status: "completed", daysAgo: 30, nextKm: 55000 },
    { vehicle: 3, type: "tire",       desc: "All tyres replaced — steer + drive",   cost: 45000, vendor: "Tyre King Nairobi",   status: "completed", daysAgo: 20, nextKm: 70000 },
    { vehicle: 4, type: "service",    desc: "Engine tune-up and injector clean",    cost: 15000, vendor: "Automax Garage",      status: "completed", daysAgo: 15, nextKm: 65000 },
    { vehicle: 0, type: "other",      desc: "Battery replacement — 200AH",         cost: 12000, vendor: "Car & General",       status: "completed", daysAgo:  8, nextKm: 75000 },
    { vehicle: 2, type: "service",    desc: "Scheduled 50,000 km service",         cost: 28000, vendor: "Isuzu Kenya",         status: "scheduled", daysAgo: -7, nextKm: 60000 },
  ];

  for (let i = 0; i < maintData.length; i++) {
    const m = maintData[i];
    const vehicle = vehicles[m.vehicle];
    await prisma.maintenanceRecord.upsert({
      where: { id: `maint_demo_${i}` },
      update: {},
      create: {
        id: `maint_demo_${i}`,
        organizationId: org.id,
        vehicleId: vehicle.id,
        type: m.type,
        description: m.desc,
        odometerKm: vehicle.odometerKm - (m.daysAgo * 50),
        cost: m.cost,
        vendor: m.vendor,
        status: m.status,
        date: new Date(Date.now() - m.daysAgo * 24 * 60 * 60 * 1000),
        nextServiceKm: m.nextKm,
      },
    });
  }

  // ── Driver GPS Locations ───────────────────────────────────────────────────────
  const nairobiArea = { lat: -1.2921, lng: 36.8219 };
  for (const driver of drivers.slice(0, 4)) {
    await prisma.driverLocation.create({
      data: {
        driverId: driver.id,
        lat: nairobiArea.lat + (Math.random() - 0.5) * 0.15,
        lng: nairobiArea.lng + (Math.random() - 0.5) * 0.15,
        accuracy: 8,
        speed: Math.random() * 80,
      },
    });
  }

  // ── Payroll Run (demo — approved) ─────────────────────────────────────────────
  const existingRun = await prisma.payrollRun.findFirst({ where: { organizationId: org.id } });
  if (!existingRun) {
    const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd   = new Date(Date.now() - 1  * 24 * 60 * 60 * 1000);
    const run = await prisma.payrollRun.create({
      data: {
        organizationId: org.id,
        periodStart,
        periodEnd,
        status: "approved",
        totalAmount: 372500,
        notes: "May 2026 payroll — 5 drivers + 4 staff",
        approvedBy: "James Mwangi",
        approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        lines: {
          create: [
            { driverId: drivers[0].id, driverName: drivers[0].name, payType: "per_trip", tripsCount: 14, daysWorked: 0, perTripRate: 2500, perDayRate: 0, tripEarnings: 35000, dayEarnings: 0, totalEarnings: 35000 },
            { driverId: drivers[1].id, driverName: drivers[1].name, payType: "per_trip", tripsCount: 12, daysWorked: 0, perTripRate: 2500, perDayRate: 0, tripEarnings: 30000, dayEarnings: 0, totalEarnings: 30000 },
            { driverId: drivers[2].id, driverName: drivers[2].name, payType: "per_day",  tripsCount:  0, daysWorked: 22, perTripRate: 0, perDayRate: 3000, tripEarnings: 0, dayEarnings: 66000, totalEarnings: 66000 },
            { driverId: drivers[3].id, driverName: drivers[3].name, payType: "both",     tripsCount: 10, daysWorked: 20, perTripRate: 2000, perDayRate: 2800, tripEarnings: 20000, dayEarnings: 56000, totalEarnings: 76000 },
            { driverId: drivers[4].id, driverName: drivers[4].name, payType: "per_trip", tripsCount: 15, daysWorked: 0, perTripRate: 2200, perDayRate: 0, tripEarnings: 33000, dayEarnings: 0, totalEarnings: 33000 },
          ],
        },
      },
    });
    console.log(`   Payroll run created: ${run.id}`);
  }

  console.log("\n✅ Seed complete!");
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📋  LOGIN CREDENTIALS");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("  🔑  Staff Portal  →  /login");
  console.log("     Super Admin   superadmin@fleetflow.io   /  Super@123");
  console.log("     Company Admin admin@aquaflow.co.ke      /  Admin@123");
  console.log("     Dispatcher    dispatch@aquaflow.co.ke   /  Dispatch@123");
  console.log("     Accountant    accounts@aquaflow.co.ke   /  Accounts@123");
  console.log("     Mechanic      mechanic@aquaflow.co.ke   /  Mechanic@123");
  console.log("     Driver        driver1@aquaflow.co.ke    /  Driver@123");
  console.log("");
  console.log("  🏢  Customer Portal  →  /customer-login");
  console.log("     Serena Hotel      portal.serena@demo.com    /  Serena@123");
  console.log("     Nairobi Hospital  portal.hospital@demo.com  /  Hospital@123");
  console.log("     Kenya Breweries   portal.kbl@demo.com       /  Kbl@1234");
  console.log("");
  console.log("  🚗  Driver App  →  /driver-login");
  console.log("     driver1@aquaflow.co.ke  /  Driver@123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
