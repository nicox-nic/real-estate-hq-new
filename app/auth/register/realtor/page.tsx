import { RegistrationForm } from "@/components/auth/RegistrationForm";
import { REALTOR_SCHEMA } from "@/lib/registrationSchemas";

export default function RealtorRegistrationPage() {
  return <RegistrationForm schema={REALTOR_SCHEMA} />;
}
