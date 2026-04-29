import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Public Debt Sustainability Analyser",
  description: "IMF-style DSA framework for Nigeria — model debt-to-GDP trajectories under custom growth and interest rate scenarios",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
