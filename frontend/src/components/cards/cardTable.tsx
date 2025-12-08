import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
} from "@mui/x-data-grid";
import { type Card } from "../../entities/cards";
import { Link } from "@tanstack/react-router";

export type CardTableProps = {
  cards?: Card[];
};

export const CardTable = (props: CardTableProps) => {
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 300 },
    {
      field: "name",
      headerName: "Name",
      width: 300,
      renderCell: (params: GridRenderCellParams<Card, string>) => (
        <Link to={`card/${params.id}`}>{params.value}</Link>
      ),
    },
    { field: "date", headerName: "Date", width: 200 },
  ];

  return (
    <DataGrid rows={props.cards} columns={columns} getRowId={(row) => row.id} />
  );
};
