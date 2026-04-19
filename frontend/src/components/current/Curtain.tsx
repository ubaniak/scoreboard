type CurtainProps = {
  side: "red" | "blue";
  name: string;
  open: boolean;
};

const CONFIG = {
  red: { background: "#b91c1c", label: "Red Corner", transform: (open: boolean) => open ? "translateX(-100%)" : "translateX(0)", position: { left: 0 } },
  blue: { background: "#1d4ed8", label: "Blue Corner", transform: (open: boolean) => open ? "translateX(100%)" : "translateX(0)", position: { right: 0 } },
};

export const Curtain = ({ side, name, open }: CurtainProps) => {
  const { background, label, transform, position } = CONFIG[side];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        ...position,
        width: "50%",
        height: "100%",
        background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        transition: "transform 0.9s cubic-bezier(0.77, 0, 0.18, 1)",
        transform: transform(open),
        zIndex: 2,
      }}
    >
      <div style={{ fontSize: 13, letterSpacing: 4, opacity: 0.65, marginBottom: 16, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: 52, fontWeight: 800, textAlign: "center", padding: "0 48px", lineHeight: 1.15 }}>
        {name || "—"}
      </div>
    </div>
  );
};
