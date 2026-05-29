"use client";

import { ManagerDashboard } from "@/components/manager/ManagerDashboard";

/**
 * Realtor Network Dashboard (#10) — parameterized ManagerDashboard,
 * role=Realtor. Same component as Broker; role prop drives transitive
 * agent resolution + framing copy.
 */
export default function RealtorDashboardPage() {
  return <ManagerDashboard role="Realtor" />;
}
