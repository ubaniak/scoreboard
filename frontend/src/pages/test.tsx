// BoutDetailsPage.jsx
// High-fidelity Ant Design (React) UI targeting 1280px container.
// Requires: antd + @ant-design/icons
//
// Install:
//   npm i antd @ant-design/icons
// Add AntD styles (V5):
//   import 'antd/dist/reset.css';

import {
  FlagOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  InputNumber,
  Layout,
  message,
  Progress,
  Row,
  Segmented,
  Select,
  Space,
  Steps,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import InfractionPanel from "../components/demo/foul";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const RED = "#cf1322";
const BLUE = "#0958d9";

function CornerHeader({ color, cornerLabel, name }) {
  return (
    <Space direction="vertical" size={6} style={{ width: "100%" }}>
      <Space align="center" wrap>
        <Tag color={color} style={{ marginRight: 0, fontWeight: 700 }}>
          {cornerLabel}
        </Tag>
        <Text type="secondary">Corner</Text>
      </Space>
      <Title level={3} style={{ margin: 0, lineHeight: 1.15 }}>
        {name || "—"}
      </Title>
    </Space>
  );
}

function StatChips({ weight, age, experience }) {
  return (
    <Space wrap size={[8, 8]}>
      <Tag style={{ padding: "4px 10px", borderRadius: 999 }}>
        Weight: {weight || "—"}
      </Tag>
      <Tag style={{ padding: "4px 10px", borderRadius: 999 }}>
        Age: {age || "—"}
      </Tag>
      <Tag style={{ padding: "4px 10px", borderRadius: 999 }}>
        Experience: <b>{experience}</b>
      </Tag>
    </Space>
  );
}

function CornerPanel({
  accent,
  cornerLabel,
  boxer,
  onChange,
  showExperienceControl = true,
}) {
  return (
    <Card
      bordered
      style={{
        height: "100%",
        borderRadius: 16,
        border: "1px solid #f0f0f0",
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}
      bodyStyle={{ padding: 16 }}
    >
      {/* Accent bar */}
      <div
        style={{
          height: 6,
          background: accent,
          borderRadius: 999,
          marginBottom: 14,
        }}
      />

      <CornerHeader
        color={accent === RED ? "red" : "blue"}
        cornerLabel={cornerLabel}
        name={boxer.name}
      />

      <Divider style={{ margin: "12px 0" }} />

      <Descriptions
        size="small"
        column={1}
        labelStyle={{ width: 110, color: "rgba(0,0,0,0.55)" }}
        contentStyle={{ fontWeight: 600 }}
      >
        <Descriptions.Item label="Weight">{boxer.weight}</Descriptions.Item>
        <Descriptions.Item label="Age">{boxer.age}</Descriptions.Item>
      </Descriptions>

      <div style={{ marginTop: 8 }}>
        <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
          Quick view
        </Text>
        <StatChips
          weight={boxer.weight}
          age={boxer.age}
          experience={boxer.experience}
        />
      </div>

      {showExperienceControl && (
        <div style={{ marginTop: 14 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>
            Experience
          </Text>
          <Segmented
            block
            options={[
              { label: "Novice", value: "Novice" },
              { label: "Open", value: "Open" },
            ]}
            value={boxer.experience}
            onChange={(v) => onChange({ ...boxer, experience: v })}
          />
        </div>
      )}
    </Card>
  );
}

function StepperRow({
  label,
  icon,
  accent,
  value,
  onChange,
  max = 9,
  tooltip,
}) {
  return (
    <Row
      align="middle"
      justify="space-between"
      gutter={12}
      style={{ padding: "10px 0" }}
    >
      <Col flex="auto">
        <Space>
          <span
            style={{
              width: 28,
              height: 28,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 10,
              background: "rgba(0,0,0,0.03)",
              border: "1px solid #f0f0f0",
              color: "rgba(0,0,0,0.65)",
            }}
          >
            {icon}
          </span>
          <Space direction="vertical" size={0}>
            <Text style={{ fontWeight: 700 }}>{label}</Text>
            {tooltip && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {tooltip}
              </Text>
            )}
          </Space>
        </Space>
      </Col>

      <Col>
        <InputNumber
          min={0}
          max={max}
          value={value}
          controls
          onChange={(v) => onChange(Number(v ?? 0))}
          style={{
            width: 140,
            borderRadius: 10,
          }}
          addonBefore={
            <span
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: 999,
                background: accent,
              }}
            />
          }
        />
      </Col>
    </Row>
  );
}

export default function BoutDetailsPage() {
  const [meta, setMeta] = useState({
    event: "City Golden Gloves",
    ring: "Ring A",
    bout: "Bout 07",
    status: "In Progress",
    division: "Welterweight",
  });

  const [redBoxer, setRedBoxer] = useState({
    name: "A. Reyes",
    weight: "72.5 kg",
    age: 19,
    experience: "Novice",
  });

  const [blueBoxer, setBlueBoxer] = useState({
    name: "J. Thompson",
    weight: "72.2 kg",
    age: 21,
    experience: "Open",
  });

  const [redInfractions, setRedInfractions] = useState({
    cautions: 0,
    warnings: 0,
    eightCounts: 0,
  });

  const [blueInfractions, setBlueInfractions] = useState({
    cautions: 0,
    warnings: 0,
    eightCounts: 0,
  });

  const totals = useMemo(() => {
    const red =
      redInfractions.cautions +
      redInfractions.warnings +
      redInfractions.eightCounts;
    const blue =
      blueInfractions.cautions +
      blueInfractions.warnings +
      blueInfractions.eightCounts;
    return { red, blue };
  }, [redInfractions, blueInfractions]);

  const onResetCorner = (corner) => {
    if (corner === "red")
      setRedInfractions({ cautions: 0, warnings: 0, eightCounts: 0 });
    if (corner === "blue")
      setBlueInfractions({ cautions: 0, warnings: 0, eightCounts: 0 });
    message.success(`Reset ${corner.toUpperCase()} corner inputs`);
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Space direction="vertical" size={0}>
            <Title level={4} style={{ margin: 0 }}>
              Bout Information
            </Title>
            <Space size={10} wrap>
              <Text type="secondary">
                {meta.event} • {meta.division}
              </Text>
              <Badge
                status={
                  meta.status === "In Progress" ? "processing" : "success"
                }
                text={meta.status}
              />
            </Space>
          </Space>

          <Space wrap>
            <Tooltip title="Edit metadata (example control)">
              <Button icon={<InfoCircleOutlined />} />
            </Tooltip>

            <Select
              value={meta.status}
              onChange={(v) => setMeta((m) => ({ ...m, status: v }))}
              style={{ width: 160 }}
              options={[
                { value: "In Progress", label: "In Progress" },
                { value: "Completed", label: "Completed" },
              ]}
            />
          </Space>
        </div>
      </Header>

      <Content style={{ padding: 16 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Top meta strip */}
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              marginBottom: 16,
            }}
            bodyStyle={{ padding: 16 }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col flex="auto">
                <Space wrap size={16} align="baseline">
                  <Space>
                    <Text type="secondary">Event</Text>
                    <Text style={{ fontWeight: 700 }}>{meta.event}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Ring</Text>
                    <Text style={{ fontWeight: 700 }}>{meta.ring}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Bout</Text>
                    <Text style={{ fontWeight: 700 }}>{meta.bout}</Text>
                  </Space>
                  <Space>
                    <Text type="secondary">Division</Text>
                    <Text style={{ fontWeight: 700 }}>{meta.division}</Text>
                  </Space>
                </Space>
              </Col>

              <Col>
                <Steps
                  size="small"
                  current={meta.status === "In Progress" ? 1 : 2}
                  items={[
                    { title: "Scheduled" },
                    { title: "In Fight" },
                    { title: "Complete" },
                  ]}
                />
              </Col>
            </Row>
          </Card>

          {/* Boxer compare */}
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <CornerPanel
                accent={RED}
                cornerLabel="RED"
                boxer={redBoxer}
                onChange={setRedBoxer}
              />
            </Col>

            <Col xs={24} md={12}>
              <CornerPanel
                accent={BLUE}
                cornerLabel="BLUE"
                boxer={blueBoxer}
                onChange={setBlueBoxer}
              />
            </Col>
          </Row>

          {/* Infractions */}
          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              marginTop: 16,
            }}
            bodyStyle={{ padding: 16 }}
            title={
              <Space>
                <Title level={4} style={{ margin: 0 }}>
                  Infractions & Counts
                </Title>
                <Text type="secondary">
                  Use steppers or type. Values clamp at max.
                </Text>
              </Space>
            }
            extra={
              <Space>
                <Tooltip title="Combined totals (quick glance)">
                  <Space size={10}>
                    <Tag
                      color="red"
                      style={{ fontWeight: 700, marginRight: 0 }}
                    >
                      RED: {totals.red}
                    </Tag>
                    <Tag
                      color="blue"
                      style={{ fontWeight: 700, marginRight: 0 }}
                    >
                      BLUE: {totals.blue}
                    </Tag>
                  </Space>
                </Tooltip>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              {/* RED column */}
              <Col xs={24} md={12}>
                <Card
                  bordered
                  style={{
                    borderRadius: 16,
                    border: "1px solid #f0f0f0",
                    overflow: "hidden",
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div
                    style={{
                      height: 6,
                      background: RED,
                      borderRadius: 999,
                      marginBottom: 12,
                    }}
                  />

                  <Space
                    direction="vertical"
                    size={0}
                    style={{ width: "100%" }}
                  >
                    <Space align="center" wrap>
                      <Tag
                        color="red"
                        style={{ fontWeight: 800, marginRight: 0 }}
                      >
                        RED
                      </Tag>
                      <Text type="secondary">Corner inputs</Text>
                    </Space>

                    <Divider style={{ margin: "12px 0" }} />

                    <StepperRow
                      label="Cautions"
                      icon={<FlagOutlined />}
                      accent={RED}
                      value={redInfractions.cautions}
                      onChange={(v) =>
                        setRedInfractions((s) => ({ ...s, cautions: v }))
                      }
                      tooltip="Minor infractions"
                      max={9}
                    />
                    <Divider style={{ margin: 0 }} />

                    <StepperRow
                      label="Warnings"
                      icon={<SafetyCertificateOutlined />}
                      accent={RED}
                      value={redInfractions.warnings}
                      onChange={(v) =>
                        setRedInfractions((s) => ({ ...s, warnings: v }))
                      }
                      tooltip="Formal warnings"
                      max={9}
                    />
                    <Divider style={{ margin: 0 }} />

                    <StepperRow
                      label="8 Counts"
                      icon={<ThunderboltOutlined />}
                      accent={RED}
                      value={redInfractions.eightCounts}
                      onChange={(v) =>
                        setRedInfractions((s) => ({ ...s, eightCounts: v }))
                      }
                      tooltip="Knockdown counts"
                      max={9}
                    />

                    <Divider style={{ margin: "12px 0" }} />

                    <Row align="middle" justify="space-between">
                      <Col>
                        <Text type="secondary">Corner risk</Text>
                      </Col>
                      <Col>
                        <Progress
                          percent={Math.min(100, totals.red * 10)}
                          size="small"
                          showInfo={false}
                        />
                      </Col>
                    </Row>

                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => onResetCorner("red")}
                      block
                      style={{
                        marginTop: 12,
                        borderRadius: 12,
                        borderColor: "rgba(207,19,34,0.35)",
                        color: RED,
                      }}
                    >
                      Reset Red
                    </Button>
                  </Space>
                </Card>
              </Col>

              {/* BLUE column */}
              <Col xs={24} md={12}>
                <Card
                  bordered
                  style={{
                    borderRadius: 16,
                    border: "1px solid #f0f0f0",
                    overflow: "hidden",
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div
                    style={{
                      height: 6,
                      background: BLUE,
                      borderRadius: 999,
                      marginBottom: 12,
                    }}
                  />

                  <Space
                    direction="vertical"
                    size={0}
                    style={{ width: "100%" }}
                  >
                    <Space align="center" wrap>
                      <Tag
                        color="blue"
                        style={{ fontWeight: 800, marginRight: 0 }}
                      >
                        BLUE
                      </Tag>
                      <Text type="secondary">Corner inputs</Text>
                    </Space>

                    <Divider style={{ margin: "12px 0" }} />

                    <StepperRow
                      label="Cautions"
                      icon={<FlagOutlined />}
                      accent={BLUE}
                      value={blueInfractions.cautions}
                      onChange={(v) =>
                        setBlueInfractions((s) => ({ ...s, cautions: v }))
                      }
                      tooltip="Minor infractions"
                      max={9}
                    />
                    <Divider style={{ margin: 0 }} />

                    <StepperRow
                      label="Warnings"
                      icon={<SafetyCertificateOutlined />}
                      accent={BLUE}
                      value={blueInfractions.warnings}
                      onChange={(v) =>
                        setBlueInfractions((s) => ({ ...s, warnings: v }))
                      }
                      tooltip="Formal warnings"
                      max={9}
                    />
                    <Divider style={{ margin: 0 }} />

                    <StepperRow
                      label="8 Counts"
                      icon={<ThunderboltOutlined />}
                      accent={BLUE}
                      value={blueInfractions.eightCounts}
                      onChange={(v) =>
                        setBlueInfractions((s) => ({ ...s, eightCounts: v }))
                      }
                      tooltip="Knockdown counts"
                      max={9}
                    />

                    <Divider style={{ margin: "12px 0" }} />

                    <Row align="middle" justify="space-between">
                      <Col>
                        <Text type="secondary">Corner risk</Text>
                      </Col>
                      <Col>
                        <Progress
                          percent={Math.min(100, totals.blue * 10)}
                          size="small"
                          showInfo={false}
                        />
                      </Col>
                    </Row>

                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => onResetCorner("blue")}
                      block
                      style={{
                        marginTop: 12,
                        borderRadius: 12,
                        borderColor: "rgba(9,88,217,0.35)",
                        color: BLUE,
                      }}
                    >
                      Reset Blue
                    </Button>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Footer actions */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col flex="auto">
              <Card
                style={{
                  borderRadius: 16,
                  boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Row align="middle" justify="space-between" gutter={[12, 12]}>
                  <Col>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary">Review</Text>
                      <Text style={{ fontWeight: 700 }}>
                        {redBoxer.name} (RED) vs {blueBoxer.name} (BLUE)
                      </Text>
                    </Space>
                  </Col>
                  <Col>
                    <Space wrap>
                      <Button style={{ borderRadius: 12 }}>Cancel</Button>
                      <Button type="primary" style={{ borderRadius: 12 }}>
                        Save Bout
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </div>
        <InfractionPanel />
      </Content>
    </Layout>
  );
}
