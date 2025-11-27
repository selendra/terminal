import type { Metadata } from "next";
import { Montserrat, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Toaster } from "react-hot-toast";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Selendra Terminal | Blockchain Explorer & Super dApp",
  description:
    "The ultimate gateway to Selendra blockchain - Explorer, Wallet, Staking, Governance, Bridge, and DeFi Dashboard. Supporting both EVM and WASM.",
  keywords: [
    "Selendra",
    "blockchain",
    "explorer",
    "wallet",
    "staking",
    "governance",
    "bridge",
    "EVM",
    "WASM",
    "Substrate",
    "DeFi",
  ],
  authors: [{ name: "Selendra Team" }],
  openGraph: {
    title: "Selendra Terminal",
    description: "The ultimate gateway to Selendra blockchain",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${montserrat.variable} ${robotoMono.variable} font-sans`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "!bg-background-card !text-white !border !border-border",
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
