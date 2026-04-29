import { Fragment } from "react";
import { colors, type, tracking } from "../../theme";

type OfficialAffiliation = {
  province?: string;
  nation?: string;
};

type ScoreTableProps = {
  scores: Record<number, { red: number; blue: number }[]>;
  warnings?: Record<number, { red: number; blue: number }>;
  showOfficialAffiliation?: "none" | "province" | "nation";
  officials?: OfficialAffiliation[];
};

export const ScoreTable = ({
  scores,
  warnings,
  showOfficialAffiliation = "none",
  officials = [],
}: ScoreTableProps) => {
  const roundNumbers = Object.keys(scores)
    .map(Number)
    .sort((a, b) => a - b);
  const judgeCount = Math.max(
    ...roundNumbers.map((r) => (scores[r] ?? []).length),
  );
  const judgeIndices = Array.from({ length: judgeCount }, (_, i) => i);

  const judgeLabel = (i: number): string => {
    if (showOfficialAffiliation === "province") {
      const val = officials[i]?.province;
      if (val) return val;
    } else if (showOfficialAffiliation === "nation") {
      const val = officials[i]?.nation;
      if (val) return val;
    }
    return `Judge ${i + 1}`;
  };

  const sep = `2px solid ${colors.border}`;
  const subSep = `1px solid ${colors.borderSubtle}`;

  const scoreVal = (r: number, j: number, corner: "red" | "blue") => {
    const s = (scores[r] ?? [])[j];
    return s != null ? s[corner] : "–";
  };

  const totalRedDeductions = roundNumbers.reduce(
    (s, r) => s + (warnings?.[r]?.red ?? 0),
    0,
  );
  const totalBlueDeductions = roundNumbers.reduce(
    (s, r) => s + (warnings?.[r]?.blue ?? 0),
    0,
  );
  const hasDeductions = totalRedDeductions > 0 || totalBlueDeductions > 0;

  const captionStyle = {
    fontSize: type.caption,
    letterSpacing: tracking.caps,
    textTransform: "uppercase" as const,
    fontWeight: 400,
    color: colors.textFaint,
  };

  return (
    <div style={{ minWidth: 480, maxWidth: "90%", overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          color: colors.text,
        }}
      >
        <thead>
          <tr>
            <th style={{ padding: "8px 16px", ...captionStyle, textAlign: "left" }} />
            {judgeIndices.map((i) => (
              <th
                key={i}
                colSpan={2}
                style={{
                  padding: "8px 0",
                  textAlign: "center",
                  borderBottom: subSep,
                  ...captionStyle,
                }}
              >
                {judgeLabel(i)}
              </th>
            ))}
          </tr>
          <tr>
            <th />
            {judgeIndices.map((i) => (
              <Fragment key={i}>
                <th
                  style={{
                    padding: "4px 12px",
                    textAlign: "center",
                    fontSize: type.caption,
                    color: colors.red,
                    fontWeight: 600,
                    borderBottom: subSep,
                  }}
                >
                  Red
                </th>
                <th
                  style={{
                    padding: "4px 12px",
                    textAlign: "center",
                    fontSize: type.caption,
                    color: colors.blue,
                    fontWeight: 600,
                    borderBottom: subSep,
                  }}
                >
                  Blue
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {roundNumbers.map((r) => (
            <tr key={r}>
              <td
                style={{
                  padding: "12px 16px",
                  fontSize: type.caption,
                  color: colors.textMuted,
                  letterSpacing: tracking.caps,
                  textTransform: "uppercase",
                }}
              >
                Round {r}
              </td>
              {judgeIndices.map((i) => (
                <Fragment key={i}>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        color: colors.red,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 22,
                      }}
                    >
                      {scoreVal(r, i, "red")}
                    </span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "center" }}>
                    <span
                      style={{
                        color: colors.blue,
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 22,
                      }}
                    >
                      {scoreVal(r, i, "blue")}
                    </span>
                  </td>
                </Fragment>
              ))}
            </tr>
          ))}

          {hasDeductions && (
            <tr style={{ borderTop: subSep }}>
              <td
                style={{
                  padding: "8px 16px",
                  fontSize: type.caption,
                  color: colors.textFaint,
                  letterSpacing: tracking.caps,
                  textTransform: "uppercase",
                }}
              >
                Deductions
              </td>
              {judgeIndices.map((i) => (
                <Fragment key={i}>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    {totalRedDeductions > 0 ? (
                      <span
                        style={{
                          color: colors.redMuted,
                          fontFamily: "monospace",
                          fontWeight: 600,
                          fontSize: 16,
                        }}
                      >
                        -{totalRedDeductions}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.25, fontSize: 14 }}>–</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", textAlign: "center" }}>
                    {totalBlueDeductions > 0 ? (
                      <span
                        style={{
                          color: colors.blueMuted,
                          fontFamily: "monospace",
                          fontWeight: 600,
                          fontSize: 16,
                        }}
                      >
                        -{totalBlueDeductions}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.25, fontSize: 14 }}>–</span>
                    )}
                  </td>
                </Fragment>
              ))}
            </tr>
          )}

          <tr style={{ borderTop: sep, background: "rgba(255,255,255,0.04)" }}>
            <td
              style={{
                padding: "16px",
                fontSize: type.body,
                fontWeight: 700,
                letterSpacing: tracking.caps,
                textTransform: "uppercase",
              }}
            >
              Total
            </td>
            {judgeIndices.map((i) => {
              const redSum =
                roundNumbers.reduce(
                  (s, r) => s + ((scores[r] ?? [])[i]?.red ?? 0),
                  0,
                ) - totalRedDeductions;
              const blueSum =
                roundNumbers.reduce(
                  (s, r) => s + ((scores[r] ?? [])[i]?.blue ?? 0),
                  0,
                ) - totalBlueDeductions;
              const redWins = redSum > blueSum;
              const blueWins = blueSum > redSum;
              return (
                <Fragment key={i}>
                  <td style={{ padding: "16px 12px", textAlign: "center" }}>
                    <WinnerCell value={redSum} color={colors.red} winner={redWins} />
                  </td>
                  <td style={{ padding: "16px 12px", textAlign: "center" }}>
                    <WinnerCell value={blueSum} color={colors.blue} winner={blueWins} />
                  </td>
                </Fragment>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const WinnerCell = ({
  value,
  color,
  winner,
}: {
  value: number;
  color: string;
  winner: boolean;
}) => (
  <div
    style={{
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: winner ? "8px 16px" : "8px 12px",
      borderRadius: 8,
      background: winner ? `${color}1F` : "transparent",
      boxShadow: winner ? `inset 0 0 0 2px ${color}` : "none",
    }}
  >
    <span
      style={{
        color,
        fontFamily: "monospace",
        fontWeight: 900,
        fontSize: 32,
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    {winner && (
      <span
        style={{
          color,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.25em",
          textTransform: "uppercase",
        }}
      >
        Winner
      </span>
    )}
  </div>
);
