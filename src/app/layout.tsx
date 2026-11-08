import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/vazirmatn";
import "react-day-picker/style.css";
import "@/styles/globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { AppProviders } from "@/components/providers/AppProviders";
import { RecurringAutoRunner } from "@/features/recurring/components/RecurringAutoRunner";
import { QuickAddHost } from "@/features/transactions/components/QuickAddHost";
import { BOOT_SCRIPT } from "@/lib/preferences/bootCache";

export const metadata: Metadata = {
  title: "Heimkasse",
  description: "Personal home & living expense manager",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f6f5" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1311" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Persian (RTL) is the default; the boot script applies the saved language/theme before paint.
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      </head>
      <body>
        <AppProviders>
          <AppShell
            overlays={
              <>
                <QuickAddHost />
                <RecurringAutoRunner />
              </>
            }
          >
            {children}
          </AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
