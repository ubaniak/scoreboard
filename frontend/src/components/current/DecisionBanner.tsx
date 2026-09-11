import { decisionLabels } from "../bouts/decisionLabels";
import { useTheme } from "../../theme";

type DecisionBannerProps = {
  winner: string;
  redCorner: string;
  blueCorner: string;
  decision?: string;
};

export const DecisionBanner = ({ winner, redCorner, blueCorner, decision }: DecisionBannerProps) => {
  const { colors } = useTheme();
  const decisionLabel = decision ? (decisionLabels[decision] ?? decision) : undefined;
  const winnerName =
    winner === "red" ? redCorner : winner === "blue" ? blueCorner : "Draw";
  const boxColor =
    winner === "red" ? colors.cornerRed : winner === "blue" ? colors.cornerBlue : "rgba(255,255,255,0.12)";

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
      <div
        style={{
          background: boxColor,
          borderRadius: 16,
          padding: "20px 48px",
          boxShadow: `0 8px 32px ${boxColor}66`,
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "white",
            lineHeight: 1.1,
          }}
        >
          {winnerName}
        </div>
        {decisionLabel && (
          <div
            style={{
              fontSize: 14,
              letterSpacing: 3,
              opacity: 0.85,
              textTransform: "uppercase",
              color: "white",
              marginTop: 8,
            }}
          >
            {decisionLabel}
          </div>
        )}
      </div>
    </div>
  );
};
