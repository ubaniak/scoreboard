import { Flex, Space } from "antd";
import { RedBlueControl } from "./redBlueControl";

export type RoundControlsProps = {
  cardId: string;
  boutId: string;
  roundNumber: number;
};

export const RoundControls = (props: RoundControlsProps) => {
  return (
    <Flex>
      <Space>
        <RedBlueControl title="Cautions" />
        <RedBlueControl title="Warnings" />
        <RedBlueControl title="Eight counts" />
      </Space>
    </Flex>
  );
};
