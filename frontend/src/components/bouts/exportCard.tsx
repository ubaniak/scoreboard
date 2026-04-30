import { Button, Flex, Space, Typography } from "antd";
import type { Card, Bout } from "../../entities/cards";
import type { ScoresByRound } from "../../entities/scores";
import {
  downloadCardFullCsv,
  downloadCardPublicCsv,
  downloadCardFullPdf,
  downloadCardPublicPdf,
} from "../../utils/boutExport";

const { Text, Title } = Typography;

type ExportCardProps = {
  card: Card;
  bouts: Bout[];
  allBoutScores: Record<string, ScoresByRound>;
};

type ExportOptionProps = {
  title: string;
  description: string;
  onCsv: () => void;
  onPdf: () => void;
};

const ExportOption = (props: ExportOptionProps) => (
  <Flex justify="space-between" align="center" style={{ padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
    <div>
      <Text strong>{props.title}</Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>{props.description}</Text>
    </div>
    <Space>
      <Button size="small" onClick={props.onCsv}>CSV</Button>
      <Button size="small" onClick={props.onPdf}>PDF</Button>
    </Space>
  </Flex>
);

export const ExportCard = (props: ExportCardProps) => {
  const { card, bouts } = props;

  return (
    <Flex vertical gap={0}>
      <Title level={5} style={{ marginBottom: 16 }}>Choose export format</Title>
      <ExportOption
        title="Full Report"
        description="All bout info including status, round length, gloves, judges, decision and comments"
        onCsv={() => downloadCardFullCsv(card, bouts)}
        onPdf={() => downloadCardFullPdf(card, bouts)}
      />
      <ExportOption
        title="Public Results"
        description="Bout info, winner and decision only"
        onCsv={() => downloadCardPublicCsv(card, bouts)}
        onPdf={() => downloadCardPublicPdf(card, bouts)}
      />
    </Flex>
  );
};
