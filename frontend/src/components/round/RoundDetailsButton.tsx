import { InfoCircleOutlined } from "@ant-design/icons";
import { Button, Col, Divider, Empty, Row, Space, Typography } from "antd";
import type { RoundDetails } from "../../entities/cards";
import { BLUE, RED } from "../../entities/corner";
import { ActionMenu } from "../actionMenu/actionMenu";

const { Text } = Typography;

type RoundDetailsButtonProps = {
  round: RoundDetails;
};

const FoulList = ({ items }: { items: string[] }) =>
  items.length === 0 ? (
    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
  ) : (
    <Space direction="vertical" size={2} style={{ width: "100%" }}>
      {items.map((f, i) => (
        <Text key={`${f}-${i}`} style={{ fontSize: 12 }}>
          • {f}
        </Text>
      ))}
    </Space>
  );

const CornerDetails = ({
  label,
  color,
  warnings,
  cautions,
  eightCounts,
}: {
  label: string;
  color: string;
  warnings: string[];
  cautions: string[];
  eightCounts: number;
}) => (
  <Space direction="vertical" size={8} style={{ width: "100%" }}>
    <Text strong style={{ color, fontSize: 14 }}>
      {label}
    </Text>
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>Cautions ({cautions.length})</Text>
      <FoulList items={cautions} />
    </div>
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>Warnings ({warnings.length})</Text>
      <FoulList items={warnings} />
    </div>
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>8-Counts</Text>
      <Text style={{ display: "block", fontSize: 14, fontWeight: 600 }}>
        {eightCounts}
      </Text>
    </div>
  </Space>
);

export const RoundDetailsButton = ({ round }: RoundDetailsButtonProps) => {
  const empty =
    round.red.warnings.length === 0 &&
    round.red.cautions.length === 0 &&
    round.red.eightCounts === 0 &&
    round.blue.warnings.length === 0 &&
    round.blue.cautions.length === 0 &&
    round.blue.eightCounts === 0;

  return (
    <ActionMenu
      width={600}
      trigger={{
        override: (onOpen) => (
          <Button
            size="small"
            type="text"
            icon={<InfoCircleOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            aria-label={`Round ${round.roundNumber} details`}
          >
            Details
          </Button>
        ),
      }}
      content={{
        title: `Round ${round.roundNumber} Details`,
        body: () =>
          empty ? (
            <Empty description="No fouls or 8-counts" />
          ) : (
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <CornerDetails
                  label="Red Corner"
                  color={RED}
                  warnings={round.red.warnings}
                  cautions={round.red.cautions}
                  eightCounts={round.red.eightCounts}
                />
              </Col>
              <Col xs={24} sm={0}>
                <Divider />
              </Col>
              <Col xs={24} sm={12}>
                <CornerDetails
                  label="Blue Corner"
                  color={BLUE}
                  warnings={round.blue.warnings}
                  cautions={round.blue.cautions}
                  eightCounts={round.blue.eightCounts}
                />
              </Col>
            </Row>
          ),
      }}
    />
  );
};
