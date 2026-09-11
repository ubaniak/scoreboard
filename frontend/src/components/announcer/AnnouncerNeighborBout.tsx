import type { Current } from "../../entities/current";
import { tracking, useTheme } from "../../theme";

type AnnouncerNeighborBoutProps = {
  label: "Previous Bout" | "Next Bout";
  bout: NonNullable<Current["nextBout"]>;
};

export const AnnouncerNeighborBout = ({ label, bout }: AnnouncerNeighborBoutProps) => {
  const { colors } = useTheme();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        opacity: 0.55,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: tracking.caps,
          color: colors.textFaint,
          textTransform: "uppercase",
        }}
      >
        {label} — Bout {bout.boutNumber}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>
        {bout.redCorner || "—"} <span style={{ opacity: 0.5, fontWeight: 400 }}>vs</span> {bout.blueCorner || "—"}
      </div>
    </div>
  );
};
