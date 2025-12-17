import { EditOutlined } from "@ant-design/icons";
import { Button, Modal, Table, type TableProps } from "antd";
import { useState } from "react";
import type { Official } from "../../entities/cards";
import { EditOfficial } from "./edit";

export type ListOfficialsProps = {
  cardId: string;
  officials: Official[];
};

export const ListOfficials = (props: ListOfficialsProps) => {
  const [open, setOpen] = useState(false);
  const [toEdit, setToEdit] = useState<Official>();
  // const { mutateAsync: deleteOfficial } = useMutateDeleteOfficial(
  //   props.card.id || ""
  // );

  // const { mutateAsync: updateOfficial } = useMutateUpdateOfficial(
  //   props.card.id
  // );

  // const handleDelete = async (id: number) => {
  //   await deleteOfficial(id.toString());
  // };

  const handleOnEditClick = (record: Official) => {
    setOpen(true);
    setToEdit(record);
  };

  const columns: TableProps<Official>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
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
            onClick={() => handleOnEditClick(record as Official)}
          />
        );
      },
    },
  ];

  return (
    <>
      <Table dataSource={props.officials} columns={columns} />
      <Modal
        title="Edit Official"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {toEdit && (
          <EditOfficial
            cardId={props.cardId}
            official={toEdit}
            onClose={() => setOpen(false)}
          />
        )}
      </Modal>
    </>
  );
};
