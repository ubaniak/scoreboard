type AthleteCornerProps = {
  corner: "red" | "blue";
  name: string;
  clubName?: string;
  imageUrl?: string;
};

const COLORS = { red: "#fca5a5", blue: "#93c5fd" };

export const AthleteCorner = ({ corner, name, clubName, imageUrl }: AthleteCornerProps) => {
  const color = COLORS[corner];
  const label = corner === "red" ? "Red Corner" : "Blue Corner";

  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div
        style={{
          fontSize: 12,
          letterSpacing: 4,
          opacity: 0.5,
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          width={96}
          height={96}
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            objectFit: "cover",
            border: `3px solid ${color}`,
            marginBottom: 12,
          }}
        />
      )}
      <div style={{ fontSize: 44, fontWeight: 800, color }}>{name || "—"}</div>
      {clubName && (
        <div
          style={{
            fontSize: 13,
            letterSpacing: 2,
            opacity: 0.55,
            textTransform: "uppercase",
            marginTop: 6,
          }}
        >
          {clubName}
        </div>
      )}
    </div>
  );
};
