import type { Current } from "../../entities/current";

export type ShowCurrentProps = {
  current?: Current;
};

export const ShowCurrent = (props: ShowCurrentProps) => {
  const { current } = props;

  if (!current?.bout) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#0b0f1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "white", fontSize: 24 }}>Scoreboard</span>
      </div>
    );
  }

  const scores = current?.scores;
  const hasScores =
    !!scores && Object.keys(scores).length > 0;

  const roundNumbers = hasScores
    ? Object.keys(scores!).map(Number).sort((a, b) => a - b)
    : [];

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0b0f1a" }}>

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
        {/* Athlete names */}
        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 12, letterSpacing: 4, opacity: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
              Red Corner
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#fca5a5" }}>
              {current?.bout?.redCorner ?? "—"}
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "0 32px" }}>
            <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              Bout
            </div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              {current?.bout?.boutNumber ?? "—"}
            </div>
            {current?.bout?.boutType && (
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.5, textTransform: "capitalize", marginTop: 4 }}>
                {current.bout.boutType}
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 12, letterSpacing: 4, opacity: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
              Blue Corner
            </div>
            <div style={{ fontSize: 44, fontWeight: 800, color: "#93c5fd" }}>
              {current?.bout?.blueCorner ?? "—"}
            </div>
          </div>
        </div>

        {/* Round score rows */}
        <div style={{ display: "flex", gap: 24, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
          {roundNumbers.map((roundNum) => {
            const roundScores = scores![roundNum] ?? [];
            const redTotal = roundScores.reduce((sum, s) => sum + s.red, 0);
            const blueTotal = roundScores.reduce((sum, s) => sum + s.blue, 0);

            return (
              <div
                key={roundNum}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "24px 32px",
                  minWidth: 220,
                  flex: 1,
                  maxWidth: 320,
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: 4, opacity: 0.5, textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>
                  Round {roundNum}
                </div>

                {roundScores.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 0",
                      borderBottom: i < roundScores.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                    }}
                  >
                    <span style={{ fontSize: 12, opacity: 0.55 }}>Judge {i + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: "#fca5a5",
                          minWidth: 32,
                          textAlign: "right",
                          ...(s.red > s.blue && {
                            background: "rgba(185,28,28,0.35)",
                            borderRadius: 6,
                            padding: "2px 8px",
                          }),
                        }}
                      >
                        {s.red}
                      </span>
                      <span style={{ opacity: 0.3, fontSize: 14 }}>–</span>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: "#93c5fd",
                          minWidth: 32,
                          textAlign: "left",
                          ...(s.blue > s.red && {
                            background: "rgba(29,78,216,0.35)",
                            borderRadius: 6,
                            padding: "2px 8px",
                          }),
                        }}
                      >
                        {s.blue}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>Total</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: "#fca5a5",
                        minWidth: 32,
                        textAlign: "right",
                        ...(redTotal > blueTotal && {
                          background: "rgba(185,28,28,0.35)",
                          borderRadius: 6,
                          padding: "2px 8px",
                        }),
                      }}
                    >
                      {redTotal}
                    </span>
                    <span style={{ opacity: 0.3, fontSize: 14 }}>–</span>
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 900,
                        color: "#93c5fd",
                        minWidth: 32,
                        textAlign: "left",
                        ...(blueTotal > redTotal && {
                          background: "rgba(29,78,216,0.35)",
                          borderRadius: 6,
                          padding: "2px 8px",
                        }),
                      }}
                    >
                      {blueTotal}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
          transform: hasScores ? "translateX(-100%)" : "translateX(0)",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 4, opacity: 0.65, marginBottom: 16, textTransform: "uppercase" }}>
          Red Corner
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, textAlign: "center", padding: "0 48px", lineHeight: 1.15 }}>
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
          transform: hasScores ? "translateX(100%)" : "translateX(0)",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 13, letterSpacing: 4, opacity: 0.65, marginBottom: 16, textTransform: "uppercase" }}>
          Blue Corner
        </div>
        <div style={{ fontSize: 52, fontWeight: 800, textAlign: "center", padding: "0 48px", lineHeight: 1.15 }}>
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
          opacity: hasScores ? 0 : 1,
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
          <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase" }}>
            Bout
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>
            {current?.bout?.boutNumber ?? "—"}
          </div>
          <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.25)", margin: "4px 0" }} />
          <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase" }}>
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
