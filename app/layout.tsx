import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Real Estate HQ — Your AI-powered real estate sales OS",
  description:
    "Close more deals. Earn more. All in one AI platform for agents, brokers, and realtors.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
