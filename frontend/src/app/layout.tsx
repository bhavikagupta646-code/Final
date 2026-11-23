import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthShield | Privacy-Preserving Zero-Knowledge Healthcare Platform",
  description: "Next-generation healthcare privacy platform utilizing Groth16 Zero-Knowledge Proofs and Ethereum Sepolia smart contracts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
