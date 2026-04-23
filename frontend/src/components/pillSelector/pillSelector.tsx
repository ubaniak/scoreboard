import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Divider, Empty, Input, Space, Tag } from "antd";
import React, { useMemo } from "react";

export interface PillSelectorProps {
  options: string[];
  onSelect: (value: string) => void;
  maxHeight?: number;
}

export const PillSelector: React.FC<PillSelectorProps> = ({
  options,
  onSelect,
  maxHeight = 120,
}) => {
  const [filter, setFilter] = React.useState("");
  const [customInput, setCustomInput] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);

  const filteredOptions = useMemo(() => {
    return options.filter((o) =>
      o.toLowerCase().includes(filter.toLowerCase()),
    );
  }, [options, filter]);

  function handlePillSelect(opt: string) {
    setSelected(opt);
    setCustomInput("");
    setFilter("");
    onSelect(opt);
  }

  function handleCustomInput(val: string) {
    setCustomInput(val);
    setSelected(null);
  }

  function handleAdd() {
    if (!customInput) return;
    setSelected(null);
    onSelect(customInput);
  }

  function highlightMatch(text: string, query: string) {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;

    return (
      <>
        {text.slice(0, idx)}
        <strong>{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    );
  }

  const isDuplicate = options.some(
    (o) => o.toLowerCase() === customInput.toLowerCase(),
  );

  return (
    <>
      <div
        style={{
          borderRadius: 6,
        }}
      >
        <Input
          prefix={<SearchOutlined />}
          placeholder="Filter options…"
          allowClear
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ borderBottom: "1px solid #f0f0f0", borderRadius: 0 }}
        />

        <div
          style={{
            maxHeight,
            overflowY: "auto",
            padding: 8,
          }}
        >
          {filteredOptions.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Space wrap>
              {filteredOptions.map((opt) => (
                <Tag.CheckableTag
                  key={opt}
                  checked={selected === opt}
                  onChange={() => handlePillSelect(opt)}
                >
                  {highlightMatch(opt, filter)}
                </Tag.CheckableTag>
              ))}
            </Space>
          )}
        </div>
      </div>

      <Divider plain>or</Divider>

      <Space.Compact style={{ width: "100%" }}>
        <Input
          placeholder="Type a custom value..."
          value={customInput}
          onChange={(e) => handleCustomInput(e.target.value)}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={!customInput || isDuplicate}
          onClick={handleAdd}
        >
          {isDuplicate ? "Exists" : "Add"}
        </Button>
      </Space.Compact>
    </>
  );
};

export default PillSelector;
