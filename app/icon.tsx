import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "20%",
          background:
            "radial-gradient(120% 120% at 0% 0%, #34d399 0%, #0f766e 45%, #0b1220 100%)",
          fontSize: 40,
          color: "#f8fafc",
        }}
      >
        🐑
      </div>
    ),
    size,
  );
}
