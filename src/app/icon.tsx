import { ImageResponse } from "next/og";
import { BrandIconTile } from "@/lib/brand-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIconTile leafSize={22} />, { ...size });
}
