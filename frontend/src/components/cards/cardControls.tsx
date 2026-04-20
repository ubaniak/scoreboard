import { Segmented, Switch, Typography } from "antd";
import { useEffect, useState } from "react";
import type { Card as CardEntity } from "../../entities/cards";
import { useMutateUpdateCards } from "../../api/cards";
import { useProfile } from "../../providers/login";
import { Card } from "../card/card";

const { Text } = Typography;

type Props = {
  card: CardEntity;
  onSetJudges: (count: number) => void;
};

export const CardControls = ({ card, onSetJudges }: Props) => {
  const { token } = useProfile();
  const updateCard = useMutateUpdateCards({ token });

  const [judgeCount, setJudgeCount] = useState<number>(card?.numberOfJudges ?? 5);
  const [showCardImage, setShowCardImage] = useState(card?.showCardImage ?? false);
  const [showAthleteImages, setShowAthleteImages] = useState(card?.showAthleteImages ?? false);
  const [showClubImages, setShowClubImages] = useState(card?.showClubImages ?? false);
  const [showOfficialAffiliation, setShowOfficialAffiliation] = useState<"none" | "province" | "nation">(card?.showOfficialAffiliation ?? "none");
  const [showAthleteAffiliation, setShowAthleteAffiliation] = useState<"club" | "province" | "nation">(card?.showAthleteAffiliation ?? "club");

  useEffect(() => {
    setJudgeCount(card?.numberOfJudges ?? 5);
    setShowCardImage(card?.showCardImage ?? false);
    setShowAthleteImages(card?.showAthleteImages ?? false);
    setShowClubImages(card?.showClubImages ?? false);
    setShowOfficialAffiliation(card?.showOfficialAffiliation ?? "none");
    setShowAthleteAffiliation(card?.showAthleteAffiliation ?? "club");
  }, [card?.numberOfJudges, card?.showCardImage, card?.showAthleteImages, card?.showClubImages, card?.showOfficialAffiliation, card?.showAthleteAffiliation]);

  const patchCard = (patch: Record<string, unknown>) => {
    updateCard.mutate({ id: { cardId: String(card.id) }, toUpdate: patch as never });
  };

  return (
    <Card title="Controls">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Text style={{ marginRight: 8 }}>Number of Judges</Text>
          <Segmented
            size="large"
            shape="round"
            value={judgeCount}
            options={[
              { value: 3, label: "3" },
              { value: 5, label: "5" },
            ]}
            onChange={(value) => {
              setJudgeCount(value as number);
              onSetJudges(value as number);
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Scoreboard Display
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              checked={showCardImage}
              onChange={(val) => {
                setShowCardImage(val);
                patchCard({ showCardImage: val });
              }}
            />
            <Text>Show card image as background</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              checked={showAthleteImages}
              onChange={(val) => {
                setShowAthleteImages(val);
                patchCard({ showAthleteImages: val });
              }}
            />
            <Text>Show athlete photos on curtain</Text>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              checked={showClubImages}
              onChange={(val) => {
                setShowClubImages(val);
                patchCard({ showClubImages: val });
              }}
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
            value={showAthleteAffiliation}
            options={[
              { value: "club", label: "Club" },
              { value: "province", label: "Province" },
              { value: "nation", label: "Nation" },
            ]}
            onChange={(value) => {
              setShowAthleteAffiliation(value as "club" | "province" | "nation");
              patchCard({ showAthleteAffiliation: value });
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Official Affiliation
          </Text>
          <Segmented
            size="large"
            shape="round"
            value={showOfficialAffiliation}
            options={[
              { value: "none", label: "None" },
              { value: "province", label: "Province" },
              { value: "nation", label: "Nation" },
            ]}
            onChange={(value) => {
              setShowOfficialAffiliation(value as "none" | "province" | "nation");
              patchCard({ showOfficialAffiliation: value });
            }}
          />
        </div>
      </div>
    </Card>
  );
};
