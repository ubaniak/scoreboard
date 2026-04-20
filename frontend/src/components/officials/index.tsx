import type {
  CreateOfficialProps,
  UpdateOfficialProps,
} from "../../api/officials";
import type { Official } from "../../entities/cards";
import { TableLayout } from "../../layouts/table";
import { ActionMenu } from "../actionMenu/actionMenu";
import { AddOfficial } from "./add";
import { ImportOfficialsCSV } from "./importCSV";
import { ListOfficials } from "./list";

export type OfficialIndexProps = {
  officials?: Official[];
  loading?: boolean;
  onEditOfficial: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => void;
  onCreateOfficial: (values: CreateOfficialProps) => void;
  onDeleteOfficial?: (officialId: string) => void;
  onImport: (file: File) => void;
};

export const OfficialIndex = (props: OfficialIndexProps) => {
  return (
    <TableLayout
      actions={
        <>
          <ActionMenu
            trigger={{ text: "import" }}
            content={{
              title: "Import Officials",
              body: (close) => (
                <ImportOfficialsCSV onClose={close} onImport={props.onImport} />
              ),
            }}
          />
          <ActionMenu
            trigger={{ text: "add" }}
            content={{
              title: "Add Official",
              body: (close) => (
                <>
                  <AddOfficial
                    onClose={close}
                    onSubmit={(values: CreateOfficialProps) => {
                      props.onCreateOfficial(values);
                    }}
                  />
                </>
              ),
            }}
          />
        </>
      }
    >
      <ListOfficials
        officials={props.officials}
        loading={props.loading}
        onEditOfficial={(vals) => props.onEditOfficial(vals)}
        onDeleteOfficial={props.onDeleteOfficial}
      />
    </TableLayout>
  );
};
