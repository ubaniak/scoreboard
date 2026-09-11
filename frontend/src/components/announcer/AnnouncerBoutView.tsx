import type { Current } from "../../entities/current";
import { AthleteCorner } from "../current/AthleteCorner";
import { space, tracking, type, useTheme } from "../../theme";

type AnnouncerBoutViewProps = {
  bout: NonNullable<Current["bout"]>;
  round?: Current["round"];
};

const statusLabel = (status: string) =>
  status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const AnnouncerBoutView = ({ bout, round }: AnnouncerBoutViewProps) => {
  const { colors } = useTheme();

  const captionStyle = {
    fontSize: 11,
    letterSpacing: tracking.caps,
    color: colors.textFaint,
    textTransform: "uppercase" as const,
  };

  const details = [
    { label: "Weight", value: `${bout.weightClass}kg` },
    { label: "Age Category", value: bout.ageCategory?.toUpperCase() },
    { label: "Gender", value: bout.gender },
    { label: "Experience", value: bout.experience },
    { label: "Gloves", value: bout.gloveSize },
    { label: "Round Length", value: `${bout.roundLength} min` },
  ].filter((d) => d.value);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: space.xl,
        width: "100%",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ ...captionStyle, marginBottom: 6 }}>Bout</div>
        <div style={{ fontSize: type.h2, fontWeight: 900, lineHeight: 1, color: colors.text }}>
          {bout.boutNumber}
        </div>
        {bout.boutType && (
          <div style={{ ...captionStyle, marginTop: 6, textTransform: "capitalize" }}>
            {bout.boutType}
          </div>
        )}
      </div>

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
          name={bout.redCorner}
          clubName={bout.redClubName}
          imageUrl={bout.redAthleteImageUrl}
        />
        <AthleteCorner
          corner="blue"
          name={bout.blueCorner}
          clubName={bout.blueClubName}
          imageUrl={bout.blueAthleteImageUrl}
        />
      </div>

      {details.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: `${space.sm}px ${space.lg}px`,
          }}
        >
          {details.map((d) => (
            <div key={d.label} style={{ textAlign: "center" }}>
              <div style={captionStyle}>{d.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, textTransform: "capitalize" }}>
                {d.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {round && (
        <div style={{ textAlign: "center" }}>
          <div style={captionStyle}>
            Round {round.roundNumber} — {statusLabel(round.status)}
          </div>
        </div>
      )}
    </div>
  );
};
