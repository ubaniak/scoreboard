import type { Current } from "../../entities/current";
import { DisplayScore } from "../score/display_score";

type Props = {
  current?: Current;
};

export const CurrentScores = ({ current }: Props) => {
  const scores = current?.scores;
  if (!scores || Object.keys(scores).length === 0) return null;

  const roundNumbers = Object.keys(scores)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div
      style={{
        background: "#111827",
        color: "white",
        borderRadius: 12,
        padding: 24,
      }}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {roundNumbers.map((roundNum) => {
          const roundScores = scores[roundNum] ?? [];
          const redTotal = roundScores.reduce((sum, s) => sum + s.red, 0);
          const blueTotal = roundScores.reduce((sum, s) => sum + s.blue, 0);

          return (
            <div key={roundNum} style={{ flex: 1 }}>
              <div
                style={{
                  background: "#1f2937",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  Round {roundNum}
                </div>
                {roundScores.map((s, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ minWidth: 60 }}>Judge {i + 1}</span>
                      <div style={{ flex: 1 }} />
                      <DisplayScore red={s.red} blue={s.blue} />
                      <div style={{ minWidth: 90 }} />
                    </div>
                    {i < roundScores.length - 1 && (
                      <div
                        style={{
                          borderTop: "1px solid #374151",
                          margin: "12px 0",
                        }}
                      />
                    )}
                  </div>
                ))}
                {roundScores.length > 0 && (
                  <>
                    <div
                      style={{
                        borderTop: "1px solid #374151",
                        margin: "12px 0",
                      }}
                    />
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={{ minWidth: 60, fontWeight: 700 }}>
                        Total
                      </span>
                      <div style={{ flex: 1 }} />
                      <DisplayScore red={redTotal} blue={blueTotal} />
                      <div style={{ minWidth: 90 }} />
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
