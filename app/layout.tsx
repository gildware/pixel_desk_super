import { Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/src/context/SessionContext";
import { SidebarProvider } from "@/src/context/SidebarContext";
import { ThemeProvider } from "@/src/context/ThemeContext";
import { BrandingProvider } from "@/src/context/BrandingContext";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata = {
  title: "PixelDesk Super Admin",
  description: "PixelDesk Super Admin - Dashboard UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <BrandingProvider>
            <SessionProvider>
              <SidebarProvider>{children}</SidebarProvider>
            </SessionProvider>
          </BrandingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
