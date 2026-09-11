import type { Current } from "../../entities/current";
import { space, useTheme } from "../../theme";
import { DecisionBanner } from "../current/DecisionBanner";
import { AnnouncerBoutView } from "./AnnouncerBoutView";
import { AnnouncerNeighborBout } from "./AnnouncerNeighborBout";

type AnnouncerIndexProps = {
  current?: Current;
};

export const AnnouncerIndex = ({ current }: AnnouncerIndexProps) => {
  const { colors } = useTheme();

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: colors.bg }}>
      <div
        aria-live="polite"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: colors.text,
          padding: `80px ${space.xxl}px calc(${space.xxl}px + env(safe-area-inset-bottom))`,
          gap: space.xl,
          overflowY: "auto",
        }}
      >
        {current?.previousBout && (
          <AnnouncerNeighborBout label="Previous Bout" bout={current.previousBout} />
        )}

        {!current?.bout ? (
          <div style={{ fontSize: 20, color: colors.textFaint, textTransform: "uppercase", letterSpacing: 2 }}>
            No active bout
          </div>
        ) : (
          <>
            {current.bout.winner && (
              <DecisionBanner
                winner={current.bout.winner}
                redCorner={current.bout.redCorner}
                blueCorner={current.bout.blueCorner}
                decision={current.bout.decision}
              />
            )}
            <AnnouncerBoutView bout={current.bout} round={current.round} />
          </>
        )}

        {current?.nextBout && (
          <AnnouncerNeighborBout label="Next Bout" bout={current.nextBout} />
        )}
      </div>
    </div>
  );
};
