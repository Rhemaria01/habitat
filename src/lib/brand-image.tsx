import {
  BRAND_FOREGROUND,
  BRAND_LEAF_COLOR,
  BRAND_LEAF_PATHS,
  BRAND_SURFACE,
} from "@/lib/brand-mark";

type BrandLeafProps = {
  size: number;
  strokeWidth?: number;
};

export function BrandLeaf({ size, strokeWidth = 2 }: BrandLeafProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={BRAND_LEAF_COLOR}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {BRAND_LEAF_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

export function BrandIconTile({ leafSize }: { leafSize: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_SURFACE,
      }}
    >
      <BrandLeaf size={leafSize} />
    </div>
  );
}

export function BrandShareCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: BRAND_SURFACE,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 28,
        }}
      >
        <BrandLeaf size={96} strokeWidth={1.75} />
        <span
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: BRAND_FOREGROUND,
          }}
        >
          Habitat
        </span>
      </div>
    </div>
  );
}
