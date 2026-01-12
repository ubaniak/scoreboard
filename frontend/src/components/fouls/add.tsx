import { Button, Select, Space } from "antd";
import { useState } from "react";
import type { Corner, FoulTypes } from "../../entities/corner";
import type { MutateAddFoulProps } from "../../api/bouts";

export type AddFoulProps = {
  fouls: string[];
  corner: Corner;
  type: FoulTypes;
  addFoul: (props: MutateAddFoulProps) => void;
};

export const AddFoul = (props: AddFoulProps) => {
  const [selectedFoul, setSelectedFoul] = useState<string | null>(null);
  const fouls = props.fouls.map((foul) => ({ label: foul, value: foul }));
  return (
    <>
      <Space style={{ marginTop: 8 }}>
        <Select
          mode="tags"
          placeholder="Select or type a foul"
          value={selectedFoul ? [selectedFoul] : []}
          onChange={(values) => setSelectedFoul(values.at(-1) || null)}
          options={fouls}
          style={{ width: 220 }}
          tokenSeparators={[","]}
        />

        <Button
          type="primary"
          disabled={!selectedFoul}
          onClick={() => {
            props.addFoul({
              corner: props.corner,
              type: props.type,
              foul: selectedFoul!,
            });
            setSelectedFoul(null);
          }}
        >
          Add
        </Button>
      </Space>
    </>
  );
};
