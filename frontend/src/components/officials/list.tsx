import { EditOutlined } from "@ant-design/icons";
import { Table, type TableProps } from "antd";
import type { Official } from "../../entities/cards";
import { Modal } from "../modal/modal";
import { EditOfficial } from "./edit";
import type { UpdateOfficialProps } from "../../api/officials";

export type ListOfficialsProps = {
  officials?: Official[];
  loading?: boolean;
  onEditOfficial: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => void;
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
          <Modal
            button={{ shape: "circle", icon: <EditOutlined /> }}
            modal={{
              title: "hi",
              body: (close) => (
                <EditOfficial
                  onClose={close}
                  onSubmit={(vals) => {
                    props.onEditOfficial(vals);
                  }}
                  official={record as Official}
                />
              ),
            }}
          />
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
