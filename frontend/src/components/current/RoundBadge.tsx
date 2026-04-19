type RoundBadgeProps = {
  boutNumber?: number;
  roundNumber?: number;
  visible: boolean;
};

export const RoundBadge = ({ boutNumber, roundNumber, visible }: RoundBadgeProps) => (
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
        background: "#0b0f1a",
        border: "4px solid rgba(255,255,255,0.9)",
        borderRadius: "50%",
        width: 220,
        height: 220,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        boxShadow: "0 0 48px rgba(0,0,0,0.7)",
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
