import {
  Button,
  Descriptions,
  Empty,
  Flex,
  Modal,
  Popconfirm,
  type DescriptionsProps,
} from "antd";
import { useState } from "react";
import { useGetBout, useMutateBoutStatus } from "../../api/bouts";
import type { Bout } from "../../entities/cards";
import { useProfile } from "../../providers/login";
import { RoundIndex } from "../round";
import { EditBout } from "./edit";
import { StatusTag } from "../status/tag";

export type ShowBoutProps = {
  cardId: string;
  boutId: string;
};

const StartBoutButton = ({ confirm }: { confirm: () => void }) => {
  return (
    <Popconfirm
      title="Start bout"
      description="This will start the bout, are you ready?"
      onConfirm={confirm}
      // onCancel={cancel}
      okText="Yes"
      cancelText="No"
    >
      <Button>Start</Button>
    </Popconfirm>
  );
};

export const ShowBout = (props: ShowBoutProps) => {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const { data: bout, isLoading } = useGetBout(
    props.cardId,
    props.boutId,
    profile.token
  );

  const { mutateAsync: updateBoutStatus } = useMutateBoutStatus(
    props.cardId,
    props.boutId,
    profile.token
  );

  if (isLoading) {
    return <>Loading</>;
  }

  const descriptionItems: DescriptionsProps["items"] = [
    {
      label: "Bout number",
      span: 6,
      children: <>{bout?.data.boutNumber}</>,
    },
    {
      label: "status",
      span: 6,
      children: <StatusTag text={bout?.data.status || ""} />,
    },
    {
      label: "Red",
      span: 3,
      children: <>{bout?.data.redCorner}</>,
    },
    {
      label: "Blue",
      span: 3,
      children: <>{bout?.data.blueCorner}</>,
    },
    {
      label: "Round Length (min)",
      span: 3,
      children: <>{bout?.data.roundLength}</>,
    },
    {
      label: "Glove size",
      span: 3,
      children: <>{bout?.data.gloveSize}</>,
    },
    {
      label: "Experience",
      span: 2,
      children: <>{bout?.data.experience}</>,
    },
    {
      label: "Age Category",
      span: 2,
      children: <>{bout?.data.ageCategory}</>,
    },
    {
      label: "Gender",
      span: 2,
      children: <>{bout?.data.gender}</>,
    },
    {
      label: "Decision",
      span: 6,
      children: <>{bout?.data.decision}</>,
    },
  ];

  return (
    <Flex vertical gap={20}>
      <Descriptions
        title="Bout information"
        bordered
        items={descriptionItems}
        column={6}
        extra={<Button onClick={() => setOpen(true)}>Edit</Button>}
      />
      {bout?.data.status === "not_started" ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Bout has not been started"
        >
          <StartBoutButton
            confirm={async () => {
              await updateBoutStatus("in_progress");
            }}
          />
        </Empty>
      ) : (
        <>
          <RoundIndex cardId={props.cardId} boutId={props.boutId} />
        </>
      )}
      <Modal
        title="Edit Bout"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <EditBout
          bout={bout?.data || ({} as Bout)}
          carId={props.cardId}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </Flex>
  );
};
