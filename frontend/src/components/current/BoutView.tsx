import type { Current } from "../../entities/current";
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

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", background: "#0b0f1a" }}>

      {/* Scores panel — sits behind the curtains */}
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
        {bout?.winner && (
          <DecisionBanner
            winner={bout.winner}
            redCorner={bout.redCorner}
            blueCorner={bout.blueCorner}
            decision={bout.decision}
          />
        )}

        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
          <AthleteCorner
            corner="red"
            name={bout?.redCorner ?? "—"}
            clubName={bout?.redClubName}
            imageUrl={bout?.redAthleteImageUrl}
          />

          <div style={{ textAlign: "center", padding: "0 32px" }}>
            <div style={{ fontSize: 11, letterSpacing: 3, opacity: 0.5, textTransform: "uppercase", marginBottom: 6 }}>Bout</div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>{bout?.boutNumber ?? "—"}</div>
            {bout?.boutType && (
              <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.5, textTransform: "capitalize", marginTop: 4 }}>
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

      {/* Card name — top overlay */}
      {card?.name && (
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
