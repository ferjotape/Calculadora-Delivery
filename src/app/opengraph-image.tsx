import { ImageResponse } from "next/og";

export const alt = "CUSTTO — Pare de precificar no chute";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#faf9f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <svg width="56" height="56" viewBox="0 0 44 44" fill="none">
            <rect x="1" y="1" width="42" height="42" rx="12" fill="#faf9f5" stroke="#e6dfd8" />
            <rect x="12" y="24" width="6" height="9" rx="2" fill="#141413" />
            <rect x="19" y="18" width="6" height="15" rx="2" fill="#141413" />
            <rect x="26" y="10" width="6" height="23" rx="2" fill="#cc785c" />
          </svg>
          <span style={{ fontSize: 36, color: "#141413", fontWeight: 600 }}>CUSTTO</span>
        </div>
        <div style={{ display: "flex", fontSize: 64, color: "#141413", fontWeight: 700, lineHeight: 1.15 }}>
          Descubra se seu prato
        </div>
        <div style={{ display: "flex", fontSize: 64, color: "#cc785c", fontWeight: 700, lineHeight: 1.15 }}>
          tá dando prejuízo.
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#3d3d3a", marginTop: 32 }}>
          Precificação automática pra restaurante e delivery. Comece grátis.
        </div>
      </div>
    ),
    { ...size }
  );
}
