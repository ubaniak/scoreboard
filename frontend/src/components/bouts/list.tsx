import { Button, Modal, Table, type TableProps } from "antd";
import type { Bout } from "../../entities/cards";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { EditBout } from "./edit";
import { RoundProgressSummary } from "../round/progress";

export type ListBoutsProps = {
  cardId: string;
  bouts: Bout[];
};
export const ListBouts = (props: ListBoutsProps) => {
  const [open, setOpen] = useState(false);
  const [toEdit, setToEdit] = useState<Bout>();
  const handleOnEditClick = (record: Bout) => {
    console.log(record);
    setOpen(true);
    setToEdit(record);
  };

  const columns: TableProps<Bout>["columns"] = [
    {
      title: "Bout Number",
      dataIndex: "boutNumber",
      key: "boutNumber",
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
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        return (
          <Button
            type="text"
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => handleOnEditClick(record as Bout)}
          />
        );
      },
    },
  ];
  return (
    <>
      <Table
        dataSource={props.bouts}
        columns={columns}
        expandable={{
          expandedRowRender: (record) => (
            <>
              <RoundProgressSummary />
            </>
          ),
        }}
      />
      <Modal
        title="Edit Bout"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {toEdit && (
          <EditBout
            bout={toEdit}
            carId={props.cardId}
            onClose={() => setOpen(false)}
          />
        )}
      </Modal>
    </>
  );
};
