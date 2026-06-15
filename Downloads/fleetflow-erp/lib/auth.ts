import "server-only";
import { prisma } from "./db";
import { createSession, deleteSession, getSession } from "./session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export type AuthUser = {
  userId: string;
  organizationId: string | null;
  role: string;
  name: string;
  email: string;
};

export async function login(email: string, password: string): Promise<{ error?: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { organization: true },
  });

  if (!user || !user.isActive) return { error: "Invalid credentials" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid credentials" };

  await createSession({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
    name: user.name,
    email: user.email ?? "",
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {};
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function requireAuth(): Promise<AuthUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return {
    userId: session.userId,
    organizationId: session.organizationId,
    role: session.role,
    name: session.name,
    email: session.email,
  };
}

export async function requireRole(...roles: string[]): Promise<AuthUser> {
  const user = await requireAuth();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireSuperAdmin(): Promise<AuthUser> {
  return requireRole("super_admin");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
