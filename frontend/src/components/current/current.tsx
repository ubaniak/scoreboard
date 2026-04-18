import type { Current } from "../../entities/current";

export type ShowCurrentProps = {
  current?: Current;
};

export const ShowCurrent = (props: ShowCurrentProps) => {
  const { current } = props;

  const boutActive =
    current?.bout?.status === "in_progress" ||
    current?.bout?.status === "waiting_for_scores" ||
    current?.bout?.status === "score_complete" ||
    current?.bout?.status === "waiting_for_decision" ||
    current?.bout?.status === "decision_made" ||
    current?.bout?.status === "show_decision" ||
    current?.bout?.status === "completed";

  if (!boutActive) {
    const next = current?.nextBout;
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0b0f1a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          color: "white",
        }}
      >
        {current?.card?.name && (
          <div
            style={{
              fontSize: 13,
              letterSpacing: 4,
              opacity: 0.5,
              textTransform: "uppercase",
            }}
          >
            {current.card.name}
          </div>
        )}
        {next ? (
          <>
            <div
              style={{
                fontSize: 13,
                letterSpacing: 4,
                opacity: 0.5,
                textTransform: "uppercase",
              }}
            >
              Up Next — Bout {next.boutNumber}
            </div>
            <div style={{ display: "flex", gap: 64, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 3,
                    opacity: 0.45,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Red Corner
                </div>
                <div
                  style={{ fontSize: 40, fontWeight: 800, color: "#fca5a5" }}
                >
                  {next.redCorner || "—"}
                </div>
              </div>
              <div style={{ fontSize: 28, opacity: 0.3, fontWeight: 900 }}>
                VS
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: 3,
                    opacity: 0.45,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Blue Corner
                </div>
                <div
                  style={{ fontSize: 40, fontWeight: 800, color: "#93c5fd" }}
                >
                  {next.blueCorner || "—"}
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                opacity: 0.45,
                fontSize: 12,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {next.weightClass > 0 && <span>{next.weightClass} lbs</span>}
              {next.ageCategory && <span>{next.ageCategory}</span>}
              {next.experience && (
                <span style={{ textTransform: "capitalize" }}>
                  {next.experience}
                </span>
              )}
            </div>
          </>
        ) : (
          <span style={{ fontSize: 24, opacity: 0.4 }}>Scoreboard</span>
        )}
      </div>
    );
  }

  const scores = current?.scores;
  const showScores = !!scores && Object.keys(scores).length > 0;

  const roundNumbers = showScores
    ? Object.keys(scores!)
        .map(Number)
        .sort((a, b) => a - b)
    : [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#0b0f1a",
      }}
    >
      {/* ── Scores panel (behind curtains) ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          padding: "80px 48px 48px",
          gap: 32,
        }}
      >
        {/* Decision banner — only shown after admin reveals it */}
        {current?.bout?.winner && (
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
                fontSize: 56,
                fontWeight: 900,
                color:
                  current.bout.winner === "red"
                    ? "#fca5a5"
                    : current.bout.winner === "blue"
                      ? "#93c5fd"
                      : "white",
                lineHeight: 1.1,
              }}
            >
              {current.bout.winner === "red"
                ? current.bout.redCorner
                : current.bout.winner === "blue"
                  ? current.bout.blueCorner
                  : "Draw"}
            </div>
            {current.bout.decision && (
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
                {current.bout.decision}
              </div>
            )}
          </div>
        )}

        {/* Athlete names */}
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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
              Red Corner
            </div>
            {current?.bout?.redAthleteImageUrl && (
              <img
                src={current.bout.redAthleteImageUrl}
                alt={current.bout.redCorner}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #fca5a5",
                  marginBottom: 12,
                }}
              />
            )}
            <div style={{ fontSize: 44, fontWeight: 800, color: "#fca5a5" }}>
              {current?.bout?.redCorner ?? "—"}
            </div>
            {current?.bout?.redClubName && (
              <div
                style={{
                  fontSize: 13,
                  letterSpacing: 2,
                  opacity: 0.55,
                  textTransform: "uppercase",
                  marginTop: 6,
                }}
              >
                {current.bout.redClubName}
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", padding: "0 32px" }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: 3,
                opacity: 0.5,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              Bout
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {current?.bout?.boutNumber ?? "—"}
            </div>
            {current?.bout?.boutType && (
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: 2,
                  opacity: 0.5,
                  textTransform: "capitalize",
                  marginTop: 4,
                }}
              >
                {current.bout.boutType}
              </div>
            )}
          </div>

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
              Blue Corner
            </div>
            {current?.bout?.blueAthleteImageUrl && (
              <img
                src={current.bout.blueAthleteImageUrl}
                alt={current.bout.blueCorner}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #93c5fd",
                  marginBottom: 12,
                }}
              />
            )}
            <div style={{ fontSize: 44, fontWeight: 800, color: "#93c5fd" }}>
              {current?.bout?.blueCorner ?? "—"}
            </div>
            {current?.bout?.blueClubName && (
              <div
                style={{
                  fontSize: 13,
                  letterSpacing: 2,
                  opacity: 0.55,
                  textTransform: "uppercase",
                  marginTop: 6,
                }}
              >
                {current.bout.blueClubName}
              </div>
            )}
          </div>
        </div>

        {/* Score table — judges as columns, rounds as rows */}
        {showScores && (() => {
          const warnings = current?.warnings;
          const judgeCount = Math.max(...roundNumbers.map((r) => (scores![r] ?? []).length));
          const judgeIndices = Array.from({ length: judgeCount }, (_, i) => i);
          const sep = "1px solid rgba(255,255,255,0.15)";
          const subSep = "1px solid rgba(255,255,255,0.08)";

          const scoreVal = (r: number, j: number, corner: "red" | "blue") => {
            const s = (scores![r] ?? [])[j];
            return s != null ? s[corner] : "–";
          };

          const totalRedDeductions = roundNumbers.reduce((s, r) => s + (warnings?.[r]?.red ?? 0), 0);
          const totalBlueDeductions = roundNumbers.reduce((s, r) => s + (warnings?.[r]?.blue ?? 0), 0);
          const hasDeductions = totalRedDeductions > 0 || totalBlueDeductions > 0;

          return (
            <div style={{ width: "100%", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "white" }}>
                <thead>
                  {/* Judge headers */}
                  <tr>
                    <th style={{ padding: "8px 16px", textAlign: "left", fontSize: 11, letterSpacing: 3, opacity: 0.4, textTransform: "uppercase", fontWeight: 400 }} />
                    {judgeIndices.map((i) => (
                      <th key={i} colSpan={2} style={{ padding: "8px 0", textAlign: "center", fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase", fontWeight: 400, borderBottom: subSep }}>
                        Judge {i + 1}
                      </th>
                    ))}
                  </tr>
                  {/* Red / Blue sub-headers */}
                  <tr>
                    <th />
                    {judgeIndices.map((i) => (
                      <>
                        <th key={`${i}_red`} style={{ padding: "4px 12px", textAlign: "center", fontSize: 12, color: "#fca5a5", fontWeight: 600, borderBottom: subSep }}>Red</th>
                        <th key={`${i}_blue`} style={{ padding: "4px 12px", textAlign: "center", fontSize: 12, color: "#93c5fd", fontWeight: 600, borderBottom: subSep }}>Blue</th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* One row per round */}
                  {roundNumbers.map((r) => (
                    <tr key={r}>
                      <td style={{ padding: "10px 16px", fontSize: 12, opacity: 0.55, letterSpacing: 2, textTransform: "uppercase" }}>
                        Round {r}
                      </td>
                      {judgeIndices.map((i) => (
                        <>
                          <td key={`${i}_red`} style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span style={{ color: "#fca5a5", fontFamily: "monospace", fontWeight: 700, fontSize: 18 }}>{scoreVal(r, i, "red")}</span>
                          </td>
                          <td key={`${i}_blue`} style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span style={{ color: "#93c5fd", fontFamily: "monospace", fontWeight: 700, fontSize: 18 }}>{scoreVal(r, i, "blue")}</span>
                          </td>
                        </>
                      ))}
                    </tr>
                  ))}
                  {/* Deductions row — only shown if any warnings exist */}
                  {hasDeductions && (
                    <tr style={{ borderTop: sep }}>
                      <td style={{ padding: "8px 16px", fontSize: 11, opacity: 0.45, letterSpacing: 2, textTransform: "uppercase" }}>
                        Deductions
                      </td>
                      {judgeIndices.map((i) => (
                        <>
                          <td key={`${i}_red`} style={{ padding: "8px 12px", textAlign: "center" }}>
                            {totalRedDeductions > 0
                              ? <span style={{ color: "rgba(252,165,165,0.5)", fontFamily: "monospace", fontWeight: 600, fontSize: 14 }}>-{totalRedDeductions}</span>
                              : <span style={{ opacity: 0.25, fontSize: 14 }}>–</span>
                            }
                          </td>
                          <td key={`${i}_blue`} style={{ padding: "8px 12px", textAlign: "center" }}>
                            {totalBlueDeductions > 0
                              ? <span style={{ color: "rgba(147,197,253,0.5)", fontFamily: "monospace", fontWeight: 600, fontSize: 14 }}>-{totalBlueDeductions}</span>
                              : <span style={{ opacity: 0.25, fontSize: 14 }}>–</span>
                            }
                          </td>
                        </>
                      ))}
                    </tr>
                  )}
                  {/* Total row */}
                  <tr style={{ borderTop: sep }}>
                    <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
                      Total
                    </td>
                    {judgeIndices.map((i) => {
                      const redSum = roundNumbers.reduce((s, r) => s + ((scores![r] ?? [])[i]?.red ?? 0), 0) - totalRedDeductions;
                      const blueSum = roundNumbers.reduce((s, r) => s + ((scores![r] ?? [])[i]?.blue ?? 0), 0) - totalBlueDeductions;
                      return (
                        <>
                          <td key={`${i}_red`} style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span style={{ color: "#fca5a5", fontFamily: "monospace", fontWeight: 900, fontSize: 22 }}>{redSum}</span>
                          </td>
                          <td key={`${i}_blue`} style={{ padding: "10px 12px", textAlign: "center" }}>
                            <span style={{ color: "#93c5fd", fontFamily: "monospace", fontWeight: 900, fontSize: 22 }}>{blueSum}</span>
                          </td>
                        </>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* ── Red curtain ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "50%",
          height: "100%",
          background: "#b91c1c",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          transition: "transform 0.9s cubic-bezier(0.77, 0, 0.18, 1)",
          transform: showScores ? "translateX(-100%)" : "translateX(0)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: 4,
            opacity: 0.65,
            marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          Red Corner
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            textAlign: "center",
            padding: "0 48px",
            lineHeight: 1.15,
          }}
        >
          {current?.bout?.redCorner ?? "—"}
        </div>
      </div>

      {/* ── Blue curtain ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          background: "#1d4ed8",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          transition: "transform 0.9s cubic-bezier(0.77, 0, 0.18, 1)",
          transform: showScores ? "translateX(100%)" : "translateX(0)",
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 13,
            letterSpacing: 4,
            opacity: 0.65,
            marginBottom: 16,
            textTransform: "uppercase",
          }}
        >
          Blue Corner
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            textAlign: "center",
            padding: "0 48px",
            lineHeight: 1.15,
          }}
        >
          {current?.bout?.blueCorner ?? "—"}
        </div>
      </div>

      {/* ── Card name (top, always visible) ── */}
      {current?.card?.name && (
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 15,
            color: "white",
            letterSpacing: 4,
            textTransform: "uppercase",
            opacity: 0.85,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            zIndex: 10,
          }}
        >
          {current.card.name}
        </div>
      )}

      {/* ── Round badge (center, always visible) ── */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10,
          pointerEvents: "none",
          transition: "opacity 0.4s ease",
          opacity: showScores ? 0 : 1,
        }}
      >
        <div
          style={{
            background: "#0b0f1a",
            border: "4px solid rgba(255,255,255,0.9)",
            borderRadius: "50%",
            width: 220,
            height: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            boxShadow: "0 0 48px rgba(0,0,0,0.7)",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              opacity: 0.5,
              textTransform: "uppercase",
            }}
          >
            Bout
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
            {current?.bout?.boutNumber ?? "—"}
          </div>
          <div
            style={{
              width: 40,
              height: 1,
              background: "rgba(255,255,255,0.25)",
              margin: "4px 0",
            }}
          />
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              opacity: 0.5,
              textTransform: "uppercase",
            }}
          >
            Round
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
            {current?.round?.roundNumber ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
};
