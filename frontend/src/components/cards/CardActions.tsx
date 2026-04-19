import { Button, Flex, Popconfirm } from "antd";

type CardActionsProps = {
  status?: string;
  onStart: () => void;
  onEnd: () => void;
};

export const CardActions = ({ status, onStart, onEnd }: CardActionsProps) => (
  <Flex gap="small">
    {status === "upcoming" && <Button onClick={onStart}>Start</Button>}
    {status === "in_progress" && (
      <Popconfirm
        title="End this card?"
        description="This will mark the card as completed."
        onConfirm={onEnd}
        okText="End Card"
        cancelText="Cancel"
      >
        <Button danger>End Card</Button>
      </Popconfirm>
    )}
  </Flex>
);
