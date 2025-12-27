import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "@tanstack/react-router";
import { Button, Modal, Table, type TableProps } from "antd";
import { useState } from "react";
import { type Card } from "../../entities/cards";
import { StatusTag } from "../status/tag";
import { EditCard } from "./editCardForm";

export type CardTableProps = {
  cards?: Card[];
};

interface DataType {
  id: string;
  name: string;
  date: string;
  status: string;
}

export const CardTable = (props: CardTableProps) => {
  const [open, setOpen] = useState(false);
  const [editCard, setEditCard] = useState<Card>();
  const navigate = useNavigate();

  const handleOnEditClick = (card: Card) => {
    setEditCard(card);
    setOpen(true);
  };

  const handleNavigate = (card: Card) => {
    navigate({ to: `/card/${card.id}` });
  };

  const columns: TableProps<DataType>["columns"] = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => {
        return (
          <Button type="link" onClick={() => handleNavigate(record as Card)}>
            {text}
          </Button>
        );
      },
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => {
        return <StatusTag text={text} />;
      },
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
            onClick={() => handleOnEditClick(record as Card)}
          />
        );
      },
    },
  ];

  return (
    <div>
      <Table dataSource={props.cards} columns={columns} />
      <Modal
        title="Edit Card"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {editCard && (
          <EditCard card={editCard} onClose={() => setOpen(false)} />
        )}
      </Modal>
    </div>
  );
};
