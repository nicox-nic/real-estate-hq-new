import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { BROKER_SCHEMA } from "@/lib/registrationSchemas";

export default function BrokerRegistrationPage() {
  return <RegistrationForm schema={BROKER_SCHEMA} />;
}
