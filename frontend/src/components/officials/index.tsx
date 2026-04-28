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

type Option = { value: number; label: string };

export type OfficialIndexProps = {
  officials?: Official[];
  loading?: boolean;
  provinces: Option[];
  nations: Option[];
  onEditOfficial: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => Promise<unknown>;
  onCreateOfficial: (values: CreateOfficialProps) => Promise<unknown>;
  onDeleteOfficial?: (officialId: string) => void;
  onImport: (file: File) => Promise<unknown>;
};

export const OfficialIndex = (props: OfficialIndexProps) => {
  return (
    <TableLayout
      actions={
        <>
          <ActionMenu
            trigger={{ text: "Import" }}
            content={{
              title: "Import Officials",
              body: (close) => (
                <ImportOfficialsCSV onClose={close} onImport={props.onImport} />
              ),
            }}
          />
          <ActionMenu
            trigger={{ text: "Add" }}
            content={{
              title: "Add Official",
              body: (close) => (
                <AddOfficial
                  provinces={props.provinces}
                  nations={props.nations}
                  onClose={close}
                  onSubmit={(values: CreateOfficialProps) => props.onCreateOfficial(values)}
                />
              ),
            }}
          />
        </>
      }
    >
      <ListOfficials
        officials={props.officials}
        loading={props.loading}
        provinces={props.provinces}
        nations={props.nations}
        onEditOfficial={(vals) => props.onEditOfficial(vals)}
        onDeleteOfficial={props.onDeleteOfficial}
      />
    </TableLayout>
  );
};
