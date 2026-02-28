import { EditOutlined } from "@ant-design/icons";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "antd";
import type { CreateCardProps, UpdateCardsProps } from "../../api/cards";
import type { CardRequestType } from "../../api/entities";
import { type Card } from "../../entities/cards";
import { TableLayout } from "../../layouts/table";
import { StatusTag } from "../status/tag";
import { Table, type TableProps } from "../table/table";
import { AddCard } from "./add";
import { EditCard } from "./edit";
import { ActionMenu } from "../actionMenu/actionMenu";

export type CardTableProps = {
  cards?: Card[];
  isLoading: boolean;
  onCreateCard: (props: CreateCardProps) => void;
  onUpdateCard: (props: {
    id: CardRequestType;
    toUpdate: UpdateCardsProps;
  }) => void;
};

interface DataType {
  id: string;
  name: string;
  date: string;
  status: string;
}

export const CardIndex = (props: CardTableProps) => {
  const navigate = useNavigate();

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
          <ActionMenu
            trigger={{ shape: "circle", icon: <EditOutlined /> }}
            content={{
              title: "Edit Card",
              body: (close) => (
                <EditCard
                  card={record as Card}
                  onClose={close}
                  onSubmit={(vals) => props.onUpdateCard(vals)}
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
      <TableLayout
        title="Cards"
        actions={
          <ActionMenu
            trigger={{
              text: "Add",
            }}
            content={{
              title: "Create Card",
              body: (close) => (
                <AddCard
                  onClose={() => close()}
                  onSubmit={(values) => {
                    props.onCreateCard(values);
                  }}
                />
              ),
            }}
          />
        }
      >
        <Table
          dataSource={props.cards || []}
          columns={columns}
          loading={props.isLoading}
        />
      </TableLayout>
    </>
  );
};
