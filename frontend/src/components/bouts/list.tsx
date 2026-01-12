import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "@tanstack/react-router";
import { Button, Table, type TableProps } from "antd";
import type { UpdateBoutProps } from "../../api/bouts";
import type { Bout } from "../../entities/cards";
import { Modal } from "../modal/modal";
import { StatusTag } from "../status/tag";
import { EditBout } from "./edit";
import type { BoutRequestType } from "../../api/entities";

export type ListBoutsProps = {
  bouts?: Bout[];
  loading?: boolean;
  onEditBout: (values: {
    toUpdate: UpdateBoutProps;
    boutInfo: BoutRequestType;
  }) => void;
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
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Modal
            button={{ shape: "circle", icon: <EditOutlined /> }}
            modal={{
              title: "hi",
              body: (close) => (
                <EditBout
                  bout={record as Bout}
                  onClose={close}
                  onSubmit={(toUpdate) =>
                    props.onEditBout({
                      toUpdate,
                      boutInfo: { boutId: record.id },
                    })
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
