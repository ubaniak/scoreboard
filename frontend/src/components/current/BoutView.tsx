import type { Current } from "../../entities/current";
import { colors, space, tracking, type } from "../../theme";
import { AthleteCorner } from "./AthleteCorner";
import { Curtain } from "./Curtain";
import { DecisionBanner } from "./DecisionBanner";
import { RoundBadge } from "./RoundBadge";
import { ScoreTable } from "./ScoreTable";

type BoutViewProps = {
  current: Current;
};

export const BoutView = ({ current }: BoutViewProps) => {
  const { bout, round, card, scores, warnings } = current;
  const showScores = !!scores && Object.keys(scores).length > 0;

  const showAthleteImages = card?.showAthleteImages ?? false;
  const showClubImages = card?.showClubImages ?? false;

  const captionStyle = {
    fontSize: 11,
    letterSpacing: tracking.caps,
    color: colors.textFaint,
    textTransform: "uppercase" as const,
  };

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
        }}
      >
        {bout?.winner && (
          <DecisionBanner
            winner={bout.winner}
            redCorner={bout.redCorner}
            blueCorner={bout.blueCorner}
            decision={bout.decision}
          />
        )}

        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <AthleteCorner
            corner="red"
            name={bout?.redCorner ?? "—"}
            clubName={bout?.redClubName}
            imageUrl={bout?.redAthleteImageUrl}
          />

          <div style={{ textAlign: "center", padding: `0 ${space.xl}px`, opacity: 0.85 }}>
            <div style={{ ...captionStyle, marginBottom: 6 }}>Bout</div>
            <div style={{ fontSize: type.h2, fontWeight: 900, lineHeight: 1 }}>
              {bout?.boutNumber ?? "—"}
            </div>
            {bout?.boutType && (
              <div style={{ ...captionStyle, marginTop: 6, textTransform: "capitalize" }}>
                {bout.boutType}
              </div>
            )}
          </div>

          <AthleteCorner
            corner="blue"
            name={bout?.blueCorner ?? "—"}
            clubName={bout?.blueClubName}
            imageUrl={bout?.blueAthleteImageUrl}
          />
        </div>

        {showScores && (
          <ScoreTable
            scores={scores!}
            warnings={warnings}
            showOfficialAffiliation={card?.showOfficialAffiliation}
            officials={card?.officials}
          />
        )}
      </div>

      <Curtain
        side="red"
        name={bout?.redCorner ?? ""}
        open={showScores}
        athleteImageUrl={showAthleteImages ? bout?.redAthleteImageUrl : undefined}
        clubImageUrl={showClubImages ? bout?.redClubImageUrl : undefined}
      />
      <Curtain
        side="blue"
        name={bout?.blueCorner ?? ""}
        open={showScores}
        athleteImageUrl={showAthleteImages ? bout?.blueAthleteImageUrl : undefined}
        clubImageUrl={showClubImages ? bout?.blueClubImageUrl : undefined}
      />

      {card?.name && (
        <div
          style={{
            position: "absolute",
            top: 28,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 18,
            color: colors.text,
            letterSpacing: tracking.caps,
            textTransform: "uppercase",
            opacity: 0.6,
            textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            zIndex: 10,
          }}
        >
          {card.name}
        </div>
      )}

      <RoundBadge
        boutNumber={bout?.boutNumber}
        roundNumber={round?.roundNumber}
        visible={!showScores}
      />
    </div>
  );
};
