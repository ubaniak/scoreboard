import { useEffect, useRef, useState } from "react";
import type { ScheduleItem } from "../../entities/current";

const PAGE_SIZE = 6;
const PAGE_INTERVAL_MS = 6000;
const TRANSITION_MS = 700;

type ScheduleRowProps = {
  bout: ScheduleItem;
  isNext: boolean;
};

const UpNextCard = ({ bout: b }: { bout: ScheduleItem }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center",
      gap: 24,
      padding: "24px 32px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.18)",
      background: "rgba(255,255,255,0.06)",
      maxWidth: 960,
      margin: "0 auto",
      width: "100%",
      boxSizing: "border-box",
    }}
  >
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#fca5a5", lineHeight: 1.2 }}>{b.redCorner || "—"}</div>
      {b.redClubName && (
        <div style={{ fontSize: 12, opacity: 0.45, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{b.redClubName}</div>
      )}
    </div>

    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", opacity: 0.5, marginBottom: 8 }}>Up Next · Bout {b.boutNumber}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
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
    </div>

    <div style={{ textAlign: "left" }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#93c5fd", lineHeight: 1.2 }}>{b.blueCorner || "—"}</div>
      {b.blueClubName && (
        <div style={{ fontSize: 12, opacity: 0.45, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>{b.blueClubName}</div>
      )}
    </div>
  </div>
);

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

export const ScheduleView = ({ cardName, bouts, nextBoutId }: ScheduleViewProps) => {
  const nextBout = nextBoutId ? bouts.find((b) => b.id === nextBoutId) : undefined;
  const listBouts = bouts;

  const needsPaging = listBouts.length > PAGE_SIZE;
  const pageCount = needsPaging ? Math.ceil(listBouts.length / PAGE_SIZE) : 1;

  const [page, setPage] = useState(0);
  // slideKey changes each advance — remounts the entering panel so the CSS animation restarts
  const [slideKey, setSlideKey] = useState(0);
  // exitingPage holds the page index that's currently animating out
  const [exitingPage, setExitingPage] = useState<number | null>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const advance = () => {
    const curr = pageRef.current;
    const next = (curr + 1) % pageCount;
    setExitingPage(curr);
    setPage(next);
    setSlideKey((k) => k + 1);
    if (exitTimer.current) clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setExitingPage(null), TRANSITION_MS);
  };

  useEffect(() => {
    if (!needsPaging) return;
    intervalRef.current = setInterval(advance, PAGE_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsPaging, pageCount]);

  useEffect(() => {
    setPage(0);
    setSlideKey((k) => k + 1);
    setExitingPage(null);
  }, [bouts.length]);

  const getPageBouts = (p: number) => listBouts.slice(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE);

  const exitingBouts = exitingPage !== null ? getPageBouts(exitingPage) : [];
  const currentBouts = getPageBouts(page);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0b0f1a",
        color: "white",
        padding: "48px 64px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes scheduleSlideOutToTop {
          from { transform: translateY(0); opacity: 1; }
          to   { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes scheduleSlideInFromBottom {
          from { transform: translateY(60%); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {cardName && (
        <div
          style={{
            fontSize: 13,
            letterSpacing: 4,
            opacity: 0.5,
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 40,
            flexShrink: 0,
          }}
        >
          {cardName}
        </div>
      )}

      {bouts.length === 0 ? (
        <div style={{ textAlign: "center", fontSize: 24, opacity: 0.4, marginTop: 80 }}>Scoreboard</div>
      ) : (
        <>
          {nextBout && (
            <div style={{ flexShrink: 0, marginBottom: 24 }}>
              <UpNextCard bout={nextBout} />
            </div>
          )}

          {listBouts.length > 0 && (
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              maxWidth: 960,
              margin: "0 auto",
              width: "100%",
            }}
          >
            {/* Exiting page — slides up and out */}
            {exitingPage !== null && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  animation: `scheduleSlideOutToTop ${TRANSITION_MS}ms ease-in-out forwards`,
                }}
              >
                {exitingBouts.map((b) => (
                  <ScheduleRow key={b.id} bout={b} isNext={false} />
                ))}
              </div>
            )}

            {/* Entering page — slides in from below */}
            <div
              key={slideKey}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                animation: exitingPage !== null
                  ? `scheduleSlideInFromBottom ${TRANSITION_MS}ms ease-in-out forwards`
                  : "none",
              }}
            >
              {currentBouts.map((b) => (
                <ScheduleRow key={b.id} bout={b} isNext={false} />
              ))}
            </div>
          </div>
          )}

          {needsPaging && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24, flexShrink: 0 }}>
              {Array.from({ length: pageCount }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: i === page ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                    transition: "background 0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
