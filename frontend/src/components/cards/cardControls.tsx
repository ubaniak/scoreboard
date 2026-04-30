import { Collapse, Segmented, Switch, Typography } from "antd";
import type { Card as CardEntity } from "../../entities/cards";

const { Text } = Typography;

type Props = {
  card: CardEntity;
  onSetJudges: (count: number) => void;
  onPatch: (patch: Record<string, unknown>) => void;
};

export const CardControls = ({ card, onSetJudges, onPatch }: Props) => {
  return (
    <Collapse
      style={{
        borderRadius: 16,
        boxShadow: "0 6px 18px rgba(0,0,0,0.4)",
        marginBottom: 16,
      }}
      items={[
        {
          key: "controls",
          label: "Controls",
          children: (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Text style={{ marginRight: 8 }}>Number of Judges</Text>
          <Segmented
            size="large"
            shape="round"
            value={card.numberOfJudges}
            options={[
              { value: 3, label: "3" },
              { value: 5, label: "5" },
            ]}
            onChange={(value) => onSetJudges(value as number)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Scoreboard Display
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              checked={card.showCardImage}
              onChange={(val) => onPatch({ showCardImage: val })}
            />
            <Text>Show card image as background</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              checked={card.showAthleteImages}
              onChange={(val) => onPatch({ showAthleteImages: val })}
            />
            <Text>Show athlete photos on curtain</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              checked={card.showClubImages}
              onChange={(val) => onPatch({ showClubImages: val })}
            />
            <Text>Show affiliation logos on curtain</Text>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Athlete Affiliation
          </Text>
          <Segmented
            size="large"
            shape="round"
            value={card.showAthleteAffiliation}
            options={[
              { value: "club", label: "Club" },
              { value: "province", label: "Province" },
              { value: "nation", label: "Nation" },
            ]}
            onChange={(value) => onPatch({ showAthleteAffiliation: value })}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Official Affiliation
          </Text>
          <Segmented
            size="large"
            shape="round"
            value={card.showOfficialAffiliation}
            options={[
              { value: "none", label: "None" },
              { value: "province", label: "Province" },
              { value: "nation", label: "Nation" },
            ]}
            onChange={(value) => onPatch({ showOfficialAffiliation: value })}
          />
        </div>
      </div>
          ),
        },
      ]}
    />
  );
};
