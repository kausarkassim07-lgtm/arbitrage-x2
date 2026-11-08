import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arbitrage X | Spot the gap. Trace the cycle.",
  description: "Explore currency conversion networks and theoretical arbitrage cycles using Floyd–Warshall and Frankfurter daily reference rates.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
