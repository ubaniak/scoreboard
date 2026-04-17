import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space, Table, type TableProps } from "antd";
import type { Official } from "../../entities/cards";
import { EditOfficial } from "./edit";
import type { UpdateOfficialProps } from "../../api/officials";
import { ActionMenu } from "../actionMenu/actionMenu";

export type ListOfficialsProps = {
  officials?: Official[];
  loading?: boolean;
  onEditOfficial: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => void;
  onDeleteOfficial?: (officialId: string) => void;
};

export const ListOfficials = (props: ListOfficialsProps) => {
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
          <Space>
            <ActionMenu
              trigger={{ shape: "circle", icon: <EditOutlined /> }}
              content={{
                title: "Edit Official",
                body: (close) => (
                  <EditOfficial
                    onClose={close}
                    onSubmit={(vals) => props.onEditOfficial(vals)}
                    official={record as Official}
                  />
                ),
              }}
            />
            {props.onDeleteOfficial && (
              <Popconfirm
                title="Delete this official?"
                onConfirm={() => props.onDeleteOfficial!(record.id)}
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
    <Table
      dataSource={props.officials || []}
      columns={columns}
      loading={props.loading}
    />
  );
};
