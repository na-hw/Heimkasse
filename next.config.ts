import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const internalHost = process.env.TAURI_DEV_HOST || "localhost";

const nextConfig: NextConfig = {
  // Static export: Tauri serves the files from `out/`. No API routes / server actions.
  output: "export",
  // Emit /settings/index.html so routes resolve when served from files (Tauri).
  trailingSlash: true,
  // next/image optimisation needs a server – disable for static export.
  images: { unoptimized: true },
  // Load assets from the dev server when running inside Tauri on a device/network host.
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  reactStrictMode: true,
};

export default nextConfig;
