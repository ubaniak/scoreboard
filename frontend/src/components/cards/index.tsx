import { DeleteOutlined, EditOutlined, PictureOutlined } from "@ant-design/icons";
import { useNavigate } from "@tanstack/react-router";
import { Button, Popconfirm, Space } from "antd";
import { ImageUpload } from "../image/imageUpload";
import type { CreateCardProps, UpdateCardsProps } from "../../api/cards";
import type { CardRequestType } from "../../api/entities";
import { type Card } from "../../entities/cards";
import { TableLayout } from "../../layouts/table";
import { StatusTag } from "../status/tag";
import { Table, type TableProps } from "../table/table";
import { AddCard } from "./add";
import { CardImport } from "./CardImport";
import { EditCard } from "./edit";
import { ActionMenu } from "../actionMenu/actionMenu";

export type CardTableProps = {
  cards?: Card[];
  isLoading: boolean;
  onCreateCard: (props: CreateCardProps) => Promise<unknown>;
  onUpdateCard: (props: {
    id: CardRequestType;
    toUpdate: UpdateCardsProps;
  }) => Promise<unknown>;
  onDeleteCard?: (cardId: string) => void;
  onUploadCardImage?: (cardId: string, file: File) => void;
  onRemoveCardImage?: (cardId: string) => void;
  onImport?: (file: File) => Promise<unknown>;
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
          <Space>
            {props.onUploadCardImage && (
              <ActionMenu
                trigger={{ shape: "circle", icon: <PictureOutlined /> }}
                content={{ title: "Upload Image", body: () => <ImageUpload currentImageUrl={(record as Card).imageUrl} onUpload={(file) => props.onUploadCardImage!(record.id, file)} onRemove={props.onRemoveCardImage ? () => props.onRemoveCardImage!(record.id) : undefined} /> }}
              />
            )}
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
            {props.onDeleteCard && (
              <Popconfirm
                title="Delete this card?"
                onConfirm={() => props.onDeleteCard!(record.id)}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button danger shape="circle" icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <TableLayout
        title="Cards"
        actions={
          <>
            {props.onImport && (
              <ActionMenu
                trigger={{ text: "Import" }}
                content={{
                  title: "Import Card",
                  body: (close) => (
                    <CardImport onClose={close} onImport={props.onImport!} />
                  ),
                }}
              />
            )}
            <ActionMenu
              trigger={{
                text: "Add",
              }}
              content={{
                title: "Create Card",
                body: (close) => (
                  <AddCard
                    onClose={() => close()}
                    onSubmit={(values) => props.onCreateCard(values)}
                  />
                ),
              }}
            />
          </>
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
