import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton } from "@mui/material";
import { DataGrid, type GridColDef, type GridRowModel } from "@mui/x-data-grid";
import {
  useGetOfficials,
  useMutateDeleteOfficial,
  useMutateUpdateOfficial,
} from "../../api/cards";
import type { Card } from "../../entities/cards";
import { AddToolbarWrapper } from "../toolbars/addToolbox";
import { AddOfficial } from "./add";

export type ListOfficialsProps = {
  card: Card;
};

export const ListOfficials = (props: ListOfficialsProps) => {
  const { data: officials } = useGetOfficials(props.card.id);
  const { mutateAsync: deleteOfficial } = useMutateDeleteOfficial(
    props.card.id
  );

  const { mutateAsync: updateOfficial } = useMutateUpdateOfficial(
    props.card.id
  );

  const handleDelete = async (id: number) => {
    await deleteOfficial(id.toString());
  };
  const columns: GridColDef[] = [
    { field: "id", headerName: "ID" },
    {
      field: "name",
      headerName: "Name",
      editable: true,
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      width: 100,
      renderCell: (params) => (
        <IconButton
          aria-label="delete"
          onClick={() => handleDelete(params.row.id)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const processRowUpdate = async (newRow: GridRowModel) => {
    await updateOfficial({
      id: newRow.id.toString(),
      name: newRow.name,
    });
    return newRow;
  };

  const toolbar = AddToolbarWrapper({
    children: <AddOfficial carId={props.card.id} />,
  });

  return (
    <DataGrid
      rows={officials?.data || []}
      columns={columns}
      processRowUpdate={processRowUpdate}
      onProcessRowUpdateError={(error) =>
        console.error("Row update error:", error)
      }
      initialState={{
        pagination: {
          paginationModel: {
            pageSize: 5,
          },
        },
      }}
      slots={{ toolbar }}
      pageSizeOptions={[5]}
      showToolbar
      disableColumnFilter
      disableColumnSelector
      disableDensitySelector
    />
  );
};
