import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { AGENT_SCHEMA } from "@/lib/registrationSchemas";

export default function AgentRegistrationPage() {
  return <RegistrationForm schema={AGENT_SCHEMA} />;
}
