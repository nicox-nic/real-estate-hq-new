"use client";

import { useParams } from "next/navigation";
import { AgentProfile } from "@/components/manager/AgentProfile";

export default function BrokerAgentProfilePage() {
  const params = useParams<{ agentId: string }>();
  return <AgentProfile role="Broker" agentId={params.agentId} />;
}
