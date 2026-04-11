import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "@tanstack/react-router";
import { Button, Table, Tag, type TableProps } from "antd";
import type { UpdateBoutProps } from "../../api/bouts";
import type { Bout, Official } from "../../entities/cards";
import { StatusTag } from "../status/tag";
import { EditBout } from "./edit";
import type { BoutRequestType } from "../../api/entities";
import { ActionMenu } from "../actionMenu/actionMenu";

export type ListBoutsProps = {
  bouts?: Bout[];
  loading?: boolean;
  officials?: Official[];
  onEditBout: (values: {
    toUpdate: UpdateBoutProps;
    boutInfo: BoutRequestType;
  }) => void;
  onDeleteBout?: (boutId: string) => void;
};
export const ListBouts = (props: ListBoutsProps) => {
  const navigate = useNavigate();

  const columns: TableProps<Bout>["columns"] = [
    {
      title: "Bout Number",
      dataIndex: "boutNumber",
      key: "boutNumber",
      render: (text, record) => (
        <>
          <Button
            type="link"
            onClick={() => navigate({ to: `bout/${record.id}` })}
          >
            {text}
          </Button>
        </>
      ),
    },
    {
      title: "Bout Type",
      dataIndex: "boutType",
      key: "boutType",
      render: (value: string) => (
        <span style={{ textTransform: "capitalize" }}>{value || "scored"}</span>
      ),
    },
    {
      title: "Red Corner",
      dataIndex: "redCorner",
      key: "redCorner",
    },
    {
      title: "Blue Corner",
      dataIndex: "blueCorner",
      key: "blueCorner",
    },
    {
      title: "Age Category",
      dataIndex: "ageCategory",
      key: "ageCategory",
    },
    {
      title: "Experience",
      dataIndex: "experience",
      key: "experience",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Round length",
      dataIndex: "roundLength",
      key: "roundLength",
    },
    {
      title: "Glove size",
      dataIndex: "gloveSize",
      key: "gloveSize",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => <StatusTag text={value} />,
    },
    {
      title: "Winner",
      dataIndex: "winner",
      key: "winner",
      render: (value) => {
        if (!value || value === "na") return null;
        return <Tag color={value}>{value === "red" ? "Red" : "Blue"}</Tag>;
      },
    },
    {
      title: "Decision",
      dataIndex: "decision",
      key: "decision",
      render: (value) => {
        const labels: Record<string, string> = {
          ud: "Unanimous Decision",
          sd: "Split Decision",
          md: "Majority Decision",
          rsc: "RSC",
          "rsc-i": "RSC (Injury)",
          abd: "Abandon",
          dq: "Disqualified",
          c: "Cancelled",
          wo: "Walk Over",
        };
        return value ? labels[value] ?? value : null;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined /> }}
            content={{
              title: "hi",
              body: (close) => (
                <EditBout
                  bout={record as Bout}
                  officials={props.officials}
                  onClose={close}
                  onSubmit={(toUpdate) =>
                    props.onEditBout({
                      toUpdate,
                      boutInfo: { boutId: record.id },
                    })
                  }
                  onDelete={
                    props.onDeleteBout
                      ? () => props.onDeleteBout!(record.id)
                      : undefined
                  }
                />
              ),
            }}
          />
        );
      },
    },
  ];
  return (
    <>
      <Table
        loading={props.loading}
        dataSource={props.bouts || []}
        columns={columns}
        scroll={{ y: 55 * 5 }}
      />
    </>
  );
};
