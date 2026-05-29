/**
 * Registration Schemas
 *
 * One declarative schema per role, listing every PRD-required field. Forms
 * render generically from these definitions, and verify can count fields per
 * role by inspecting the schemas directly (no JSX parsing).
 *
 * Field types:
 *   text     - single-line text
 *   email    - email input with browser validation
 *   tel      - phone number
 *   password - password input
 *   select   - dropdown with predefined options
 *   textarea - multi-line text
 *   checkbox - consent / boolean
 *
 * The PRD specifies different field sets per role; schemas are NOT shared
 * across roles. The shared generic renderer is the abstraction.
 *
 * PRD coverage per role (count of required fields excludes the consent
 * checkbox which is uniform):
 *
 *   Agent   — full name, email, mobile, password×2, agent number,
 *             where-you-work (parent-type), parent name, parent license,
 *             parent company, parent contact, parent email, office location
 *             = 13 required fields + consent
 *
 *   Broker  — full name, email, mobile, password×2, broker license,
 *             PRC license (optional), realty/brokerage name, business
 *             address, office location, number of agents under broker
 *             = 11 required fields + consent (PRC optional)
 *
 *   Realtor — full name, email, mobile, password×2, realtor membership,
 *             board/association name, broker license (optional, if also broker),
 *             realty/brokerage name, business address, office location
 *             = 11 required fields + consent (broker license optional)
 *
 * Document requirements per role drive the Upload Documents screen (#6).
 */

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "password"
  | "select"
  | "textarea"
  | "checkbox";

export interface FieldOption {
  value: string;
  label: string;
}

export interface RegistrationField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  hint?: string;
  options?: FieldOption[];
  /** Group fields under section headings */
  section: string;
}

export interface RegistrationSchema {
  role: "Agent" | "Broker" | "Realtor";
  title: string;
  subtitle: string;
  fields: RegistrationField[];
  /** Required documents for this role */
  documents: RoleDocumentRequirement[];
}

export interface RoleDocumentRequirement {
  id: string;
  label: string;
  description: string;
  required: boolean;
  acceptHint: string;
}

// ---------------------------------------------------------------------------
// Agent schema
// ---------------------------------------------------------------------------

export const AGENT_SCHEMA: RegistrationSchema = {
  role: "Agent",
  title: "Agent Registration",
  subtitle: "Tell us about yourself and the broker, realtor, or realty you work under.",
  fields: [
    // Basic
    {
      id: "fullName",
      label: "Full name",
      type: "text",
      required: true,
      placeholder: "e.g. Juan Dela Cruz",
      section: "Basic",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      required: true,
      placeholder: "you@example.com",
      section: "Basic",
    },
    {
      id: "mobile",
      label: "Mobile number",
      type: "tel",
      required: true,
      placeholder: "+63 9XX XXX XXXX",
      section: "Basic",
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      required: true,
      hint: "At least 8 characters",
      section: "Basic",
    },
    {
      id: "confirmPassword",
      label: "Confirm password",
      type: "password",
      required: true,
      section: "Basic",
    },
    // Agent-specific
    {
      id: "agentNumber",
      label: "Agent / accreditation number",
      type: "text",
      required: true,
      placeholder: "e.g. AG-2024-1234",
      hint: "Issued by the broker or realty you're affiliated with.",
      section: "Accreditation",
    },
    // Parent
    {
      id: "parentType",
      label: "I work under a…",
      type: "select",
      required: true,
      section: "Affiliation",
      options: [
        { value: "broker", label: "Licensed Broker" },
        { value: "realtor", label: "Realtor" },
        { value: "realty", label: "Realty Company" },
        { value: "developer", label: "Developer Sales Team" },
      ],
    },
    {
      id: "parentName",
      label: "Name of broker / realtor / realty",
      type: "text",
      required: true,
      placeholder: "e.g. Maria Santos",
      section: "Affiliation",
    },
    {
      id: "parentLicense",
      label: "Broker / realtor license number",
      type: "text",
      required: true,
      placeholder: "REB-00XXXXX",
      hint: "Required if affiliating with a licensed individual.",
      section: "Affiliation",
    },
    {
      id: "parentCompany",
      label: "Company / realty name",
      type: "text",
      required: true,
      placeholder: "e.g. Santos Realty Group",
      section: "Affiliation",
    },
    {
      id: "parentContact",
      label: "Affiliation contact number",
      type: "tel",
      required: true,
      placeholder: "+63 XX XXX XXXX",
      section: "Affiliation",
    },
    {
      id: "parentEmail",
      label: "Affiliation email",
      type: "email",
      required: true,
      placeholder: "broker@realty.ph",
      section: "Affiliation",
    },
    {
      id: "officeLocation",
      label: "Office location",
      type: "text",
      required: true,
      placeholder: "e.g. Cebu City",
      section: "Affiliation",
    },
    {
      id: "consent",
      label: "I agree to the Terms of Service and Privacy Policy.",
      type: "checkbox",
      required: true,
      section: "Consent",
    },
  ],
  documents: [
    {
      id: "valid-id",
      label: "Valid government ID",
      description: "Driver's license, passport, or UMID.",
      required: true,
      acceptHint: "JPG / PNG / PDF",
    },
    {
      id: "accreditation-letter",
      label: "Proof of accreditation",
      description:
        "Authorization letter from your broker, realtor, or realty company.",
      required: true,
      acceptHint: "PDF / DOCX",
    },
    {
      id: "agent-photo",
      label: "Profile photo (optional)",
      description: "Headshot for your agent profile.",
      required: false,
      acceptHint: "JPG / PNG",
    },
  ],
};

// ---------------------------------------------------------------------------
// Broker schema
// ---------------------------------------------------------------------------

export const BROKER_SCHEMA: RegistrationSchema = {
  role: "Broker",
  title: "Broker Registration",
  subtitle: "Verify your brokerage and license details to manage agents and listings.",
  fields: [
    {
      id: "fullName",
      label: "Full name",
      type: "text",
      required: true,
      section: "Basic",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      required: true,
      section: "Basic",
    },
    {
      id: "mobile",
      label: "Mobile number",
      type: "tel",
      required: true,
      placeholder: "+63 9XX XXX XXXX",
      section: "Basic",
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      required: true,
      hint: "At least 8 characters",
      section: "Basic",
    },
    {
      id: "confirmPassword",
      label: "Confirm password",
      type: "password",
      required: true,
      section: "Basic",
    },
    {
      id: "brokerLicenseNumber",
      label: "Broker license number",
      type: "text",
      required: true,
      placeholder: "REB-00XXXXX",
      section: "License",
    },
    {
      id: "prcLicenseNumber",
      label: "PRC license number",
      type: "text",
      required: false,
      placeholder: "PRC-00XXXXX",
      hint: "Optional — provide if PRC-registered.",
      section: "License",
    },
    {
      id: "companyName",
      label: "Realty or brokerage name",
      type: "text",
      required: true,
      placeholder: "e.g. Santos Realty Group",
      section: "Business",
    },
    {
      id: "businessAddress",
      label: "Business address",
      type: "textarea",
      required: true,
      placeholder: "Street, building, city",
      section: "Business",
    },
    {
      id: "officeLocation",
      label: "Office location (city)",
      type: "text",
      required: true,
      section: "Business",
    },
    {
      id: "numAgentsUnderBroker",
      label: "Number of agents under broker",
      type: "text",
      required: true,
      placeholder: "e.g. 9",
      hint: "Approximate is fine.",
      section: "Business",
    },
    {
      id: "consent",
      label: "I agree to the Terms of Service and Privacy Policy.",
      type: "checkbox",
      required: true,
      section: "Consent",
    },
  ],
  documents: [
    {
      id: "broker-license",
      label: "Broker license document",
      description: "Scanned copy of your current broker license.",
      required: true,
      acceptHint: "JPG / PNG / PDF",
    },
    {
      id: "valid-id",
      label: "Valid government ID",
      description: "Driver's license, passport, or UMID.",
      required: true,
      acceptHint: "JPG / PNG / PDF",
    },
    {
      id: "business-permit",
      label: "Business permit (optional)",
      description: "Provide if you operate a registered brokerage.",
      required: false,
      acceptHint: "PDF",
    },
  ],
};

// ---------------------------------------------------------------------------
// Realtor schema
// ---------------------------------------------------------------------------

export const REALTOR_SCHEMA: RegistrationSchema = {
  role: "Realtor",
  title: "Realtor Registration",
  subtitle:
    "Manage your realty network — agents, listings, broadcasts, and analytics.",
  fields: [
    {
      id: "fullName",
      label: "Full name",
      type: "text",
      required: true,
      section: "Basic",
    },
    {
      id: "email",
      label: "Email",
      type: "email",
      required: true,
      section: "Basic",
    },
    {
      id: "mobile",
      label: "Mobile number",
      type: "tel",
      required: true,
      placeholder: "+63 9XX XXX XXXX",
      section: "Basic",
    },
    {
      id: "password",
      label: "Password",
      type: "password",
      required: true,
      hint: "At least 8 characters",
      section: "Basic",
    },
    {
      id: "confirmPassword",
      label: "Confirm password",
      type: "password",
      required: true,
      section: "Basic",
    },
    {
      id: "realtorMembershipNumber",
      label: "Realtor membership number",
      type: "text",
      required: true,
      placeholder: "PRB-YYYY-XXXXX",
      section: "Accreditation",
    },
    {
      id: "boardOrAssociation",
      label: "Board or association name",
      type: "text",
      required: true,
      placeholder: "e.g. Philippine Association of Real Estate Brokers",
      section: "Accreditation",
    },
    {
      id: "brokerLicenseNumber",
      label: "Broker license number (if also licensed broker)",
      type: "text",
      required: false,
      placeholder: "REB-00XXXXX",
      hint: "Optional — only if you also hold a broker license.",
      section: "Accreditation",
    },
    {
      id: "companyName",
      label: "Realty or brokerage name",
      type: "text",
      required: true,
      section: "Business",
    },
    {
      id: "businessAddress",
      label: "Business address",
      type: "textarea",
      required: true,
      section: "Business",
    },
    {
      id: "officeLocation",
      label: "Office location (city)",
      type: "text",
      required: true,
      section: "Business",
    },
    {
      id: "consent",
      label: "I agree to the Terms of Service and Privacy Policy.",
      type: "checkbox",
      required: true,
      section: "Consent",
    },
  ],
  documents: [
    {
      id: "realtor-id",
      label: "Realtor ID or certificate",
      description: "Membership ID from your real estate board.",
      required: true,
      acceptHint: "JPG / PNG / PDF",
    },
    {
      id: "valid-id",
      label: "Valid government ID",
      description: "Driver's license, passport, or UMID.",
      required: true,
      acceptHint: "JPG / PNG / PDF",
    },
  ],
};

export const SCHEMAS_BY_ROLE = {
  Agent: AGENT_SCHEMA,
  Broker: BROKER_SCHEMA,
  Realtor: REALTOR_SCHEMA,
} as const;

/** Count of required fields per role — verify uses this. */
export function requiredFieldCount(schema: RegistrationSchema): number {
  return schema.fields.filter((f) => f.required).length;
}

/** Count of required documents per role — verify uses this. */
export function requiredDocumentCount(schema: RegistrationSchema): number {
  return schema.documents.filter((d) => d.required).length;
}
