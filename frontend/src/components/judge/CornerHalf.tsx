type CornerHalfProps = {
  corner: "red" | "blue";
  name: string;
  score: number | null;
  dimmed: boolean;
  locked: boolean;
  onTap: () => void;
};

const CONFIG = {
  red:  { background: "#991b1b", label: "Red Corner" },
  blue: { background: "#1d4ed8", label: "Blue Corner" },
};

export const CornerHalf = ({ corner, name, score, dimmed, locked, onTap }: CornerHalfProps) => {
  const { background, label } = CONFIG[corner];

  return (
    <div
      onClick={onTap}
      style={{
        flex: 1,
        background,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: locked ? "default" : "pointer",
        opacity: dimmed ? 0.45 : 1,
        transition: "opacity 0.3s ease",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ fontSize: 12, letterSpacing: 4, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", marginBottom: 16 }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: "white", textAlign: "center", padding: "0 24px", lineHeight: 1.2 }}>
        {name}
      </div>
      {score !== null && (
        <div style={{ fontSize: 96, fontWeight: 900, color: "white", lineHeight: 1, marginTop: 32 }}>
          {score}
        </div>
      )}
    </div>
  );
};
