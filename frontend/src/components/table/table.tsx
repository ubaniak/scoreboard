import { Table as AntTable, type TableProps as AntTableProps } from "antd";

export interface TableProps<T> extends AntTableProps<T> {
  a?: string;
}

export const Table = <T,>(props: TableProps<T>) => {
  return <AntTable<T> {...props} scroll={{ y: 55 * 5 }} size="small" />;
};
