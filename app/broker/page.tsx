"use client";

import { ManagerDashboard } from "@/components/manager/ManagerDashboard";

/**
 * Broker Command Center (#9) — parameterized ManagerDashboard, role=Broker.
 * Same composition + same component as Realtor Network Dashboard;
 * role prop drives team-vs-network scope and framing copy.
 */
export default function BrokerDashboardPage() {
  return <ManagerDashboard role="Broker" />;
}
