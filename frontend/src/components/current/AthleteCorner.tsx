import { colors, cornerColor, space, tracking, type } from "../../theme";

type AthleteCornerProps = {
  corner: "red" | "blue";
  name: string;
  clubName?: string;
  imageUrl?: string;
};

export const AthleteCorner = ({ corner, name, clubName, imageUrl }: AthleteCornerProps) => {
  const color = cornerColor(corner);
  const label = corner === "red" ? "Red Corner" : "Blue Corner";

  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div
        style={{
          fontSize: type.caption,
          letterSpacing: tracking.caps,
          color: colors.textFaint,
          textTransform: "uppercase",
          marginBottom: space.sm,
        }}
      >
        {label}
      </div>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          width={128}
          height={128}
          style={{
            width: 128,
            height: 128,
            borderRadius: "50%",
            objectFit: "cover",
            border: `4px solid ${color}`,
            marginBottom: space.md,
          }}
        />
      )}
      <div
        style={{
          fontSize: 64,
          fontWeight: 900,
          color,
          lineHeight: 1.05,
          textShadow: `0 2px 18px ${color}33`,
        }}
      >
        {name || "—"}
      </div>
      {clubName && (
        <div
          style={{
            fontSize: 14,
            letterSpacing: tracking.caps,
            color: colors.textMuted,
            textTransform: "uppercase",
            marginTop: space.sm,
          }}
        >
          {clubName}
        </div>
      )}
    </div>
  );
};
