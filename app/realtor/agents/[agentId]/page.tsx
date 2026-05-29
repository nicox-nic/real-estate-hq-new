"use client";

import { useParams } from "next/navigation";
import { AgentProfile } from "@/components/manager/AgentProfile";

export default function RealtorAgentProfilePage() {
  const params = useParams<{ agentId: string }>();
  return <AgentProfile role="Realtor" agentId={params.agentId} />;
}
