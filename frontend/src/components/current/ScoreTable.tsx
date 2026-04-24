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

  const sep = "1px solid rgba(255,255,255,0.15)";
  const subSep = "1px solid rgba(255,255,255,0.08)";

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

  return (
    <div style={{ width: "60%", overflowX: "auto" }}>
      <table
        style={{ width: "100%", borderCollapse: "collapse", color: "white" }}
      >
        <thead>
          <tr>
            <th
              style={{
                padding: "8px 16px",
                textAlign: "left",
                fontSize: 11,
                letterSpacing: 3,
                opacity: 0.4,
                textTransform: "uppercase",
                fontWeight: 400,
              }}
            />
            {judgeIndices.map((i) => (
              <th
                key={i}
                colSpan={2}
                style={{
                  padding: "8px 0",
                  textAlign: "center",
                  fontSize: 11,
                  letterSpacing: 3,
                  opacity: 0.5,
                  textTransform: "uppercase",
                  fontWeight: 400,
                  borderBottom: subSep,
                }}
              >
                {judgeLabel(i)}
              </th>
            ))}
          </tr>
          <tr>
            <th />
            {judgeIndices.map((i) => (
              <>
                <th
                  key={`${i}_red`}
                  style={{
                    padding: "4px 12px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "#fca5a5",
                    fontWeight: 600,
                    borderBottom: subSep,
                  }}
                >
                  Red
                </th>
                <th
                  key={`${i}_blue`}
                  style={{
                    padding: "4px 12px",
                    textAlign: "center",
                    fontSize: 12,
                    color: "#93c5fd",
                    fontWeight: 600,
                    borderBottom: subSep,
                  }}
                >
                  Blue
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {roundNumbers.map((r) => (
            <tr key={r}>
              <td
                style={{
                  padding: "10px 16px",
                  fontSize: 12,
                  opacity: 0.55,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Round {r}
              </td>
              {judgeIndices.map((i) => (
                <>
                  <td
                    key={`${i}_red`}
                    style={{ padding: "10px 12px", textAlign: "center" }}
                  >
                    <span
                      style={{
                        color: "#fca5a5",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {scoreVal(r, i, "red")}
                    </span>
                  </td>
                  <td
                    key={`${i}_blue`}
                    style={{ padding: "10px 12px", textAlign: "center" }}
                  >
                    <span
                      style={{
                        color: "#93c5fd",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        fontSize: 18,
                      }}
                    >
                      {scoreVal(r, i, "blue")}
                    </span>
                  </td>
                </>
              ))}
            </tr>
          ))}

          {hasDeductions && (
            <tr style={{ borderTop: sep }}>
              <td
                style={{
                  padding: "8px 16px",
                  fontSize: 11,
                  opacity: 0.45,
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Deductions
              </td>
              {judgeIndices.map((i) => (
                <>
                  <td
                    key={`${i}_red`}
                    style={{ padding: "8px 12px", textAlign: "center" }}
                  >
                    {totalRedDeductions > 0 ? (
                      <span
                        style={{
                          color: "rgba(252,165,165,0.5)",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        -{totalRedDeductions}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.25, fontSize: 14 }}>–</span>
                    )}
                  </td>
                  <td
                    key={`${i}_blue`}
                    style={{ padding: "8px 12px", textAlign: "center" }}
                  >
                    {totalBlueDeductions > 0 ? (
                      <span
                        style={{
                          color: "rgba(147,197,253,0.5)",
                          fontFamily: "monospace",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        -{totalBlueDeductions}
                      </span>
                    ) : (
                      <span style={{ opacity: 0.25, fontSize: 14 }}>–</span>
                    )}
                  </td>
                </>
              ))}
            </tr>
          )}

          <tr style={{ borderTop: sep }}>
            <td
              style={{
                padding: "10px 16px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 2,
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
                <>
                  <td
                    key={`${i}_red`}
                    style={{ padding: "10px 12px", textAlign: "center" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span
                        style={{
                          color: "#fca5a5",
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: 22,
                        }}
                      >
                        {redSum}
                      </span>
                      {redWins && (
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fca5a5" }} />
                      )}
                    </div>
                  </td>
                  <td
                    key={`${i}_blue`}
                    style={{ padding: "10px 12px", textAlign: "center" }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span
                        style={{
                          color: "#93c5fd",
                          fontFamily: "monospace",
                          fontWeight: 900,
                          fontSize: 22,
                        }}
                      >
                        {blueSum}
                      </span>
                      {blueWins && (
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#93c5fd" }} />
                      )}
                    </div>
                  </td>
                </>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
};
