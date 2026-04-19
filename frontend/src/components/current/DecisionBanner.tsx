type DecisionBannerProps = {
  winner: string;
  redCorner: string;
  blueCorner: string;
  decision?: string;
};

export const DecisionBanner = ({ winner, redCorner, blueCorner, decision }: DecisionBannerProps) => {
  const winnerName =
    winner === "red" ? redCorner : winner === "blue" ? blueCorner : "Draw";
  const winnerColor =
    winner === "red" ? "#fca5a5" : winner === "blue" ? "#93c5fd" : "white";

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 13,
          letterSpacing: 6,
          opacity: 0.5,
          textTransform: "uppercase",
          color: "white",
          marginBottom: 8,
        }}
      >
        Decision
      </div>
      <div style={{ fontSize: 56, fontWeight: 900, color: winnerColor, lineHeight: 1.1 }}>
        {winnerName}
      </div>
      {decision && (
        <div
          style={{
            fontSize: 14,
            letterSpacing: 3,
            opacity: 0.6,
            textTransform: "uppercase",
            color: "white",
            marginTop: 8,
          }}
        >
          {decision}
        </div>
      )}
    </div>
  );
};
