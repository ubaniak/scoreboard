import { Card, Select, Button, List, Typography, Space } from "antd";
import { useState } from "react";

const { Text } = Typography;

const FOUL_OPTIONS = [
  { label: "Low Blow", value: "Low Blow" },
  { label: "Headbutt", value: "Headbutt" },
  { label: "Holding", value: "Holding" },
  { label: "Excessive Clinching", value: "Excessive Clinching" },
];

const normalizeFoul = (value: string) => value.trim().replace(/\s+/g, " ");

export default function InfractionPanel() {
  const [redFouls, setRedFouls] = useState<string[]>([]);
  const [blueFouls, setBlueFouls] = useState<string[]>([]);

  const [selectedRedFoul, setSelectedRedFoul] = useState<string | null>(null);
  const [selectedBlueFoul, setSelectedBlueFoul] = useState<string | null>(null);

  const addFoul = (color: "red" | "blue") => {
    if (color === "red" && selectedRedFoul) {
      setRedFouls((prev) => [...prev, normalizeFoul(selectedRedFoul)]);
      setSelectedRedFoul(null);
    }

    if (color === "blue" && selectedBlueFoul) {
      setBlueFouls((prev) => [...prev, normalizeFoul(selectedBlueFoul)]);
      setSelectedBlueFoul(null);
    }
  };

  const removeFoul = (color: "red" | "blue", index: number) => {
    if (color === "red") {
      setRedFouls((prev) => prev.filter((_, i) => i !== index));
    } else {
      setBlueFouls((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const renderSide = (
    title: string,
    color: "red" | "blue",
    fouls: string[],
    selectedFoul: string | null,
    setSelectedFoul: (v: string | null) => void
  ) => (
    <div style={{ flex: 1 }}>
      <Text strong style={{ color }}>
        {title}
      </Text>

      <Space style={{ marginTop: 8 }}>
        <Select
          mode="tags"
          placeholder="Select or type a foul"
          value={selectedFoul ? [selectedFoul] : []}
          onChange={(values) => setSelectedFoul(values.at(-1) || null)}
          options={FOUL_OPTIONS}
          style={{ width: 220 }}
          tokenSeparators={[","]}
        />

        <Button
          type="primary"
          disabled={!selectedFoul}
          onClick={() => addFoul(color)}
        >
          Add
        </Button>
      </Space>

      <List
        size="small"
        bordered
        style={{ marginTop: 12, maxHeight: 140, overflowY: "auto" }}
        dataSource={fouls}
        locale={{ emptyText: "No fouls recorded" }}
        renderItem={(item, idx) => (
          <List.Item
            actions={[
              <Button
                type="link"
                size="small"
                onClick={() => removeFoul(color, idx)}
              >
                Remove
              </Button>,
            ]}
          >
            {item}
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Card
      title="Infractions"
      style={{ marginTop: 24, borderRadius: 12 }}
      bodyStyle={{ padding: 24 }}
    >
      <Space size={48} style={{ width: "100%" }}>
        {renderSide(
          "Red Boxer",
          "red",
          redFouls,
          selectedRedFoul,
          setSelectedRedFoul
        )}

        {renderSide(
          "Blue Boxer",
          "blue",
          blueFouls,
          selectedBlueFoul,
          setSelectedBlueFoul
        )}
      </Space>
    </Card>
  );
}
