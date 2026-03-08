import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "POS Management",
  description: "Aplikasi POS multi-cabang untuk toko kelontong"
};

const themeBootstrapScript = `(() => {
  try {
    const key = "pos-theme";
    const fromStorage = localStorage.getItem(key);
    const fromSystem = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = fromStorage === "dark" || fromStorage === "light" ? fromStorage : fromSystem;
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
