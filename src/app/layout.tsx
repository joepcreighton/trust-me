import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import { UserRecsProvider } from "@/lib/user-recs-context";
import { UserProfileProvider } from "@/lib/user-profile-context";
import { SettingsProvider } from "@/lib/settings-context";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "trust me",
  description: "Recommendations from people you actually trust.",
  appleWebApp: {
    capable: true,
    title: "trust me",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FAF7F2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`}>
      <body>
        <AuthProvider>
          <SettingsProvider>
            <UserRecsProvider>
              <UserProfileProvider>
                <AppShell>{children}</AppShell>
              </UserProfileProvider>
            </UserRecsProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
