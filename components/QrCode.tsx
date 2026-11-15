import QRCode from "qrcode";
import { useMemo } from "react";

/**
 * A QR code drawn as one SVG path, here in the browser. Generating it locally
 * matters: an online QR service would see every deposit address and amount.
 */
export function QrCode({ value, label }: { value: string; label: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
    let d = "";
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { size: modules.size, path: d };
  }, [value]);

  // A four-module quiet zone, which scanners need to find the code.
  const margin = 4;
  return (
    <svg
      viewBox={`${-margin} ${-margin} ${size + margin * 2} ${size + margin * 2}`}
      className="h-48 w-48 rounded-xl bg-white"
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
    >
      <rect
        x={-margin}
        y={-margin}
        width={size + margin * 2}
        height={size + margin * 2}
        fill="#ffffff"
      />
      <path d={path} fill="#110f0f" />
    </svg>
  );
}
