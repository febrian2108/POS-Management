import type { Metadata } from "next";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
  title: "POSKU",
  description: "Aplikasi internal POSKU untuk manajemen toko multi-cabang.",
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
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
        <link rel="shortcut icon" href="/Icon-POSKU.png" type="image/x-icon" />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
