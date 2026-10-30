import { ImageResponse } from "next/og";
import { BrandShareCard } from "@/lib/brand-image";

export const alt = "Habitat — leaf mark with app name";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(<BrandShareCard />, { ...size });
}
