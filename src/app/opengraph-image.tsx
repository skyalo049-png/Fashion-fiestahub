import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Generated rather than a binary in /public, so the brand colours stay in
 * one place and there is no stale asset to forget.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0e0e0f",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#c9a96e",
          }}
        >
          {site.city}, {site.country}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              color: "#f4f0eb",
              lineHeight: 1.1,
            }}
          >
            {site.name}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 36,
              color: "#c9a96e",
            }}
          >
            {site.tagline}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            color: "rgba(244,240,235,0.5)",
          }}
        >
          <div style={{ display: "flex", width: 80, height: 3, background: "#c9a96e" }} />
          <div style={{ display: "flex" }}>
            M-Pesa accepted · Nationwide shipping
          </div>
        </div>
      </div>
    ),
    size,
  );
}