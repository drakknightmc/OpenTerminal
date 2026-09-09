import type { Metadata } from "next";
import "./globals.css";
import "./nocturne.css";
import Providers from "./providers";
import FinanceShell from "../components/finance/FinanceShell";

export const metadata: Metadata = {
  title: "LedgerLine — OpenTerminal",
  description: "Personal finance terminal built on OpenTerminal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <Providers>
          <FinanceShell>{children}</FinanceShell>
        </Providers>
      </body>
    </html>
  );
}
