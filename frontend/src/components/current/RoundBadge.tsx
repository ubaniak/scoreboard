import { useTheme } from "../../theme";

type RoundBadgeProps = {
  boutNumber?: number;
  roundNumber?: number;
  visible: boolean;
};

export const RoundBadge = ({ boutNumber, roundNumber, visible }: RoundBadgeProps) => {
  const { colors, mode } = useTheme();
  const ring = mode === "dark" ? "rgba(255,255,255,0.9)" : "rgba(11,15,26,0.35)";
  const haloShadow = mode === "dark" ? "0 0 48px rgba(0,0,0,0.7)" : "0 0 32px rgba(11,15,26,0.25)";

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        pointerEvents: "none",
        transition: "opacity 0.4s ease",
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          background: colors.bg,
          border: `4px solid ${ring}`,
          borderRadius: "50%",
          width: 220,
          height: 220,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: colors.text,
          boxShadow: `${haloShadow}, inset 0 1px 0 ${colors.insetHighlight}`,
          gap: 4,
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase" }}>Bout</div>
        <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{boutNumber ?? "—"}</div>
        <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.25)", margin: "4px 0" }} />
        <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase" }}>Round</div>
        <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{roundNumber ?? "—"}</div>
      </div>
    </div>
  );
};
