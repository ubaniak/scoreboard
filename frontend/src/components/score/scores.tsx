import { Divider, Flex, Typography } from "antd";
import type { RoundDetails } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import { Card } from "../card/card";
import { DisplayScore } from "./display_score";
import { ScoreDisplay } from "./score";

const { Text } = Typography;

export type ScoresProps = {
  scores: ScoresByRound;
  rounds?: RoundDetails[];
  boutStatus?: string;
};

const ROUNDS = [1, 2, 3];

export const Scores = ({ scores, rounds }: ScoresProps) => {
  return (
    <Card title="Scores">
    <Flex gap="middle">
      {ROUNDS.map((round) => {
        const roundScores = scores[round] ?? [];
        const roundDetails = rounds?.find((r) => r.roundNumber === round);
        const redWarnings = roundDetails?.red.warnings.length ?? 0;
        const blueWarnings = roundDetails?.blue.warnings.length ?? 0;
        const redTotal = roundScores.reduce((sum, s) => sum + s.red, 0) - redWarnings;
        const blueTotal = roundScores.reduce((sum, s) => sum + s.blue, 0) - blueWarnings;
        return (
          <Flex key={round} style={{ flex: 1 }}>
            <Card title={`Round ${round}`}>
              {roundScores.map((score, j) => (
                <div key={score.judgeRole}>
                  <ScoreDisplay score={score} />
                  {j < roundScores.length - 1 && (
                    <Divider style={{ margin: "12px 0" }} />
                  )}
                </div>
              ))}
              {roundScores.length > 0 && (
                <>
                  <Divider style={{ margin: "12px 0" }} />
                  {(redWarnings > 0 || blueWarnings > 0) && (
                    <Flex align="center" style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ minWidth: 60, fontSize: 12 }}>Warnings</Text>
                      <div style={{ flex: 1 }} />
                      <Flex gap="small" align="center">
                        <Text style={{ color: "#ff4d4f", fontFamily: "monospace", fontWeight: 700, minWidth: 24, textAlign: "center", fontSize: 12 }}>
                          {redWarnings > 0 ? `-${redWarnings}` : "–"}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>–</Text>
                        <Text style={{ color: "#1677ff", fontFamily: "monospace", fontWeight: 700, minWidth: 24, textAlign: "center", fontSize: 12 }}>
                          {blueWarnings > 0 ? `-${blueWarnings}` : "–"}
                        </Text>
                      </Flex>
                      <div style={{ minWidth: 90 }} />
                    </Flex>
                  )}
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
