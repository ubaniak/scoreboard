import type { ScheduleItem } from "../../entities/current";

type ScheduleRowProps = {
  bout: ScheduleItem;
  isNext: boolean;
};

const ScheduleRow = ({ bout: b, isNext }: ScheduleRowProps) => {
  const isDone = b.status === "completed" || b.status === "show_decision";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "48px 1fr auto 1fr auto",
        alignItems: "center",
        gap: 16,
        padding: "16px 24px",
        borderRadius: 8,
        border: isNext ? "2px solid rgba(255,255,255,0.7)" : "1px solid rgba(255,255,255,0.08)",
        background: isNext ? "rgba(255,255,255,0.05)" : "transparent",
        opacity: isDone ? 0.45 : 1,
      }}
    >
      <div style={{ fontSize: 13, opacity: 0.4, letterSpacing: 1, textAlign: "center" }}>
        {b.boutNumber}
      </div>

      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fca5a5", lineHeight: 1.2 }}>{b.redCorner || "—"}</div>
        {b.redClubName && (
          <div style={{ fontSize: 11, opacity: 0.45, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{b.redClubName}</div>
        )}
      </div>

      <div style={{ textAlign: "center", minWidth: 160 }}>
        {isDone && b.winner ? (
          <div style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 }}>
            <span style={{ color: b.winner === "red" ? "#fca5a5" : b.winner === "blue" ? "#93c5fd" : "white", fontWeight: 700 }}>
              {b.winner === "red" ? b.redCorner : b.winner === "blue" ? b.blueCorner : "Draw"}
            </span>
            {b.decision && <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{b.decision}</div>}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", gap: 12, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.45 }}>
              {b.weightClass > 0 && <span>{b.weightClass} kg</span>}
              {b.gloveSize && <span>{b.gloveSize}</span>}
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", opacity: 0.35 }}>
              {b.roundLength > 0 && <span>{b.roundLength}min</span>}
              {b.ageCategory && <span>{b.ageCategory}</span>}
              {b.experience && <span>{b.experience}</span>}
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#93c5fd", lineHeight: 1.2 }}>{b.blueCorner || "—"}</div>
        {b.blueClubName && (
          <div style={{ fontSize: 11, opacity: 0.45, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>{b.blueClubName}</div>
        )}
      </div>

      <div style={{ minWidth: 72, textAlign: "center" }}>
        {isNext && (
          <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.7, border: "1px solid rgba(255,255,255,0.4)", borderRadius: 4, padding: "2px 8px" }}>
            Up Next
          </span>
        )}
      </div>
    </div>
  );
};

type ScheduleViewProps = {
  cardName?: string;
  bouts: ScheduleItem[];
  nextBoutId?: string;
};

export const ScheduleView = ({ cardName, bouts, nextBoutId }: ScheduleViewProps) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#0b0f1a",
      color: "white",
      overflowY: "auto",
      padding: "48px 64px",
      boxSizing: "border-box",
    }}
  >
    {cardName && (
      <div
        style={{
          fontSize: 13,
          letterSpacing: 4,
          opacity: 0.5,
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        {cardName}
      </div>
    )}
    {bouts.length === 0 ? (
      <div style={{ textAlign: "center", fontSize: 24, opacity: 0.4, marginTop: 80 }}>Scoreboard</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 960, margin: "0 auto" }}>
        {bouts.map((b) => (
          <ScheduleRow key={b.id} bout={b} isNext={b.id === nextBoutId} />
        ))}
      </div>
    )}
  </div>
);
