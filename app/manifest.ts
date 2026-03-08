import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "POSKU",
    short_name: "POSKU",
    description: "Aplikasi internal POSKU untuk manajemen toko multi-cabang.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2f5f8",
    theme_color: "#18485d",
    icons: [
      {
        src: "/Icon-POSKU-192x192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/Icon-POSKU-512x512.png",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/Icon-POSKU-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [
      {
        src: "/screenshot/desktop/Dashboard-owner-pos-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "Dashboard Owner POSKU (Desktop)"
      },
      {
        src: "/screenshot/mobile/dashboard-pos-mobile.png",
        sizes: "377x669",
        type: "image/png",
        form_factor: "narrow",
        label: "Dashboard POSKU (Mobile)"
      }
    ]
  };
}
