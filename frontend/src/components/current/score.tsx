import { Divider, Flex, Typography } from "antd";
import type { Current } from "../../entities/current";
import { Card } from "../card/card";
import { DisplayScore } from "../score/display_score";

const { Text } = Typography;

type Props = {
  current?: Current;
};

export const CurrentScores = ({ current }: Props) => {
  const scores = current?.scores;
  if (!scores || Object.keys(scores).length === 0) return null;

  const roundNumbers = Object.keys(scores)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <Card title="Scores">
      <Flex gap="middle">
        {roundNumbers.map((roundNum) => {
          const roundScores = scores[roundNum] ?? [];
          const redTotal = roundScores.reduce((sum, s) => sum + s.red, 0);
          const blueTotal = roundScores.reduce((sum, s) => sum + s.blue, 0);

          return (
            <Flex key={roundNum} style={{ flex: 1 }}>
              <Card title={`Round ${roundNum}`}>
                {roundScores.map((s, i) => (
                  <div key={i}>
                    <Flex align="center">
                      <Text style={{ minWidth: 60 }}>Judge {i + 1}</Text>
                      <div style={{ flex: 1 }} />
                      <DisplayScore red={s.red} blue={s.blue} />
                      <div style={{ minWidth: 90 }} />
                    </Flex>
                    {i < roundScores.length - 1 && (
                      <Divider style={{ margin: "12px 0" }} />
                    )}
                  </div>
                ))}
                {roundScores.length > 0 && (
                  <>
                    <Divider style={{ margin: "12px 0" }} />
                    <Flex align="center">
                      <Text strong style={{ minWidth: 60 }}>Total</Text>
                      <div style={{ flex: 1 }} />
                      <DisplayScore red={redTotal} blue={blueTotal} />
                      <div style={{ minWidth: 90 }} />
                    </Flex>
                  </>
                )}
              </Card>
            </Flex>
          );
        })}
      </Flex>
    </Card>
  );
};
