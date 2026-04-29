import { Typography } from "antd";
import type { Official } from "../../../entities/cards";
import { colors, formatRole, space, tracking, type } from "../../../theme";

type NameScreenProps = {
  role: string;
  officials: Official[];
  onSelect: (name: string) => void;
};

export const NameScreen = ({ role, officials, onSelect }: NameScreenProps) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: colors.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: space.xl,
      gap: space.lg,
    }}
  >
    <Typography.Text
      style={{
        fontSize: type.caption,
        letterSpacing: tracking.caps,
        textTransform: "uppercase",
        color: colors.textFaint,
      }}
    >
      {formatRole(role)}
    </Typography.Text>
    <Typography.Title level={3} style={{ margin: 0, color: colors.text }}>
      Select your name
    </Typography.Title>

    {officials.length === 0 ? (
      <Typography.Text style={{ color: colors.textMuted }}>
        No officials assigned to this card.
      </Typography.Text>
    ) : (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: space.md,
          width: "100%",
          maxWidth: 720,
        }}
      >
        {officials.map((o) => (
          <button
            key={o.name}
            type="button"
            onClick={() => onSelect(o.name)}
            aria-label={`Select ${o.name}`}
            style={{
              minHeight: 88,
              padding: `${space.md}px ${space.lg}px`,
              borderRadius: 12,
              border: `1px solid ${colors.border}`,
              background: "rgba(255,255,255,0.04)",
              color: colors.text,
              fontSize: type.h3,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s ease, transform 0.05s ease",
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.98)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
          >
            {o.name}
          </button>
        ))}
      </div>
    )}
  </div>
);
