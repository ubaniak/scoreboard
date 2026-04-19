import { Space, Typography } from "antd";
import type { RoundDetails } from "../../entities/cards";

const { Text } = Typography;

type RoundSummaryProps = {
  round: RoundDetails;
};

export const RoundSummary = ({ round }: RoundSummaryProps) => {
  const redWarnings = round.red.warnings.length;
  const blueWarnings = round.blue.warnings.length;
  const redCautions = round.red.cautions.length;
  const blueCautions = round.blue.cautions.length;
  const redEights = round.red.eightCounts;
  const blueEights = round.blue.eightCounts;

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
        Round {round.roundNumber}
      </Text>
      <Space direction="vertical" size={4}>
        <Space size={4}>
          <Text style={{ fontSize: 12, minWidth: 70 }} type="secondary">Cautions</Text>
          <Text style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 12 }}>{redCautions}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
          <Text style={{ color: "#1677ff", fontWeight: 700, fontSize: 12 }}>{blueCautions}</Text>
        </Space>
        <Space size={4}>
          <Text style={{ fontSize: 12, minWidth: 70 }} type="secondary">Warnings</Text>
          <Text style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 12 }}>{redWarnings}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
          <Text style={{ color: "#1677ff", fontWeight: 700, fontSize: 12 }}>{blueWarnings}</Text>
        </Space>
        <Space size={4}>
          <Text style={{ fontSize: 12, minWidth: 70 }} type="secondary">8-Counts</Text>
          <Text style={{ color: "#ff4d4f", fontWeight: 700, fontSize: 12 }}>{redEights}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
          <Text style={{ color: "#1677ff", fontWeight: 700, fontSize: 12 }}>{blueEights}</Text>
        </Space>
      </Space>
    </div>
  );
};
