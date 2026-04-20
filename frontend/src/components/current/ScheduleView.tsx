import { useEffect, useRef, useState } from "react";
import type { ScheduleItem } from "../../entities/current";

const PAGE_SIZE = 6;
const PAGE_INTERVAL_MS = 6000;
const TRANSITION_MS = 700;

type ScheduleRowProps = {
  bout: ScheduleItem;
  isNext: boolean;
  hasImage: boolean;
};

type FeaturedRowProps = {
  bout: ScheduleItem;
  size: "sm" | "lg";
  label?: string;
  hasImage: boolean;
};

const FeaturedRow = ({ bout: b, size, label, hasImage }: FeaturedRowProps) => {
  const isDone = b.status === "completed" || b.status === "show_decision";
  const isLg = size === "lg";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: isLg ? 24 : 16,
        padding: isLg ? "22px 32px" : "12px 24px",
        borderRadius: isLg ? 12 : 8,
        border: isLg ? "1px solid rgba(255,255,255,0.22)" : "1px solid rgba(255,255,255,0.07)",
        background: hasImage
          ? isLg ? "#1a2035" : "#131929"
          : isLg ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
        opacity: size === "sm" ? 0.55 : 1,
        maxWidth: 960,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
        transition: "opacity 0.3s",
      }}
    >
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: isLg ? 26 : 15, fontWeight: isLg ? 800 : 600, color: "#fca5a5", lineHeight: 1.2 }}>
          {b.redCorner || "—"}
        </div>
        {isLg && b.redClubName && (
          <div style={{ fontSize: 11, opacity: 0.4, letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>{b.redClubName}</div>
        )}
      </div>

      <div style={{ textAlign: "center", minWidth: isLg ? 160 : 120 }}>
        {label && (
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", opacity: 0.45, marginBottom: isLg ? 6 : 3 }}>
            {label} · Bout {b.boutNumber}
          </div>
        )}
        {isDone && b.winner ? (
          <div style={{ fontSize: isLg ? 13 : 11, letterSpacing: 1, textTransform: "uppercase" }}>
            <span style={{ color: b.winner === "red" ? "#fca5a5" : b.winner === "blue" ? "#93c5fd" : "white", fontWeight: 700 }}>
              {b.winner === "red" ? b.redCorner : b.winner === "blue" ? b.blueCorner : "Draw"}
            </span>
            {b.decision && (
              <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>{b.decision}</div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 10, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.4 }}>
              {b.weightClass > 0 && <span>{b.weightClass} kg</span>}
              {b.gloveSize && <span>{b.gloveSize}</span>}
            </div>
            {isLg && (
              <div style={{ display: "flex", gap: 10, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.3 }}>
                {b.roundLength > 0 && <span>{b.roundLength}min</span>}
                {b.ageCategory && <span>{b.ageCategory}</span>}
                {b.experience && <span>{b.experience}</span>}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: isLg ? 26 : 15, fontWeight: isLg ? 800 : 600, color: "#93c5fd", lineHeight: 1.2 }}>
          {b.blueCorner || "—"}
        </div>
        {isLg && b.blueClubName && (
          <div style={{ fontSize: 11, opacity: 0.4, letterSpacing: 1, textTransform: "uppercase", marginTop: 3 }}>{b.blueClubName}</div>
        )}
      </div>
    </div>
  );
};

type FeaturedBoutsProps = {
  bouts: ScheduleItem[];
  nextBoutId: string;
  hasImage: boolean;
};

const FeaturedBouts = ({ bouts, nextBoutId, hasImage }: FeaturedBoutsProps) => {
  const idx = bouts.findIndex((b) => b.id === nextBoutId);
  if (idx === -1) return null;

  const prev = idx > 0 ? bouts[idx - 1] : undefined;
  const current = bouts[idx];
  const next = idx < bouts.length - 1 ? bouts[idx + 1] : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, marginBottom: 20 }}>
      {prev && <FeaturedRow bout={prev} size="sm" label="Previous" hasImage={hasImage} />}
      <FeaturedRow bout={current} size="lg" label="Up Next" hasImage={hasImage} />
      {next && <FeaturedRow bout={next} size="sm" label="After" hasImage={hasImage} />}
    </div>
  );
};

const ScheduleRow = ({ bout: b, isNext, hasImage }: ScheduleRowProps) => {
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
        background: hasImage
          ? isNext ? "#1e2d4a" : "#131929"
          : isNext ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
        opacity: 1,
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
  cardImageUrl?: string;
  bouts: ScheduleItem[];
  nextBoutId?: string;
};

export const ScheduleView = ({ cardName, cardImageUrl, bouts, nextBoutId }: ScheduleViewProps) => {
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
        ...(cardImageUrl ? {
          backgroundImage: `url(${cardImageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {}),
        color: "white",
        padding: "48px 64px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {cardImageUrl && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(11, 15, 26, 0.82)",
          zIndex: 0,
        }} />
      )}
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

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>

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
          {nextBoutId && <FeaturedBouts bouts={bouts} nextBoutId={nextBoutId} hasImage={!!cardImageUrl} />}

          {listBouts.length > 0 && (
          <div
            style={{
              position: "relative",
              overflow: "hidden",
              maxWidth: 960,
              margin: "0 auto",
              width: "100%",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "16px",
              boxSizing: "border-box",
              background: cardImageUrl ? "#0d1120" : "transparent",
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
                  <ScheduleRow key={b.id} bout={b} isNext={false} hasImage={!!cardImageUrl} />
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
                <ScheduleRow key={b.id} bout={b} isNext={false} hasImage={!!cardImageUrl} />
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
    </div>
  );
};
