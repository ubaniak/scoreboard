import {
  Button,
  Descriptions,
  Drawer,
  Modal,
  Tabs,
  type DescriptionsProps,
  type TabsProps,
} from "antd";
import { useState } from "react";
import { useGetBout } from "../../api/bouts";
import type { Bout } from "../../entities/cards";
import { useProfile } from "../../providers/login";
import { EditBout } from "./edit";
import {
  CheckCircleOutlined,
  LockOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { RoundControls } from "../round/controls";

export type ShowBoutProps = {
  cardId: string;
  boutId: string;
};

export const ShowBout = (props: ShowBoutProps) => {
  const profile = useProfile();
  const [open, setOpen] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const { data: bout, isLoading } = useGetBout(
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
      children: <>{bout?.data.status}</>,
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

  const roundItems: TabsProps["items"] = [
    {
      key: "1",
      label: "Round 1",
      children: (
        <RoundControls
          cardId={props.cardId}
          boutId={props.boutId}
          roundNumber={1}
        />
      ),
      icon: <LockOutlined />,
    },
    {
      key: "2",
      label: "Round 2",
      children: (
        <RoundControls
          cardId={props.cardId}
          boutId={props.boutId}
          roundNumber={2}
        />
      ),
      icon: <CheckCircleOutlined />,
    },
    {
      key: "3",
      label: "Round 3",
      children: (
        <RoundControls
          cardId={props.cardId}
          boutId={props.boutId}
          roundNumber={3}
        />
      ),
      icon: <PlayCircleOutlined />,
    },
  ];

  return (
    <>
      <Descriptions
        title="Bout information"
        bordered
        items={descriptionItems}
        column={6}
        extra={<Button onClick={() => setOpen(true)}>Edit</Button>}
      />
      <Tabs items={roundItems} tabPlacement="start" />
      <Button onClick={() => setOpenDrawer(true)}>openDrawer</Button>
      <Drawer
        placement="bottom"
        size={900}
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
        title="Waiting for scores"
      >
        <p>content</p>
      </Drawer>
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
    </>
  );
};
