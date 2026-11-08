import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Kiseh",
  description: "Personal home & living expense manager",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // `dir` will be driven by the active locale later (fa → rtl).
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
