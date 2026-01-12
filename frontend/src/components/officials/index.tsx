import type {
  CreateOfficialProps,
  UpdateOfficialProps,
} from "../../api/officials";
import type { Official } from "../../entities/cards";
import { TableLayout } from "../../layouts/table";
import { Modal } from "../modal/modal";
import { AddOfficial } from "./add";
import { ListOfficials } from "./list";

export type OfficialIndexProps = {
  officials?: Official[];
  loading?: boolean;
  onEditOfficial: (vals: {
    toUpdate: UpdateOfficialProps;
    officialId: string;
  }) => void;
  onCreateOfficial: (values: CreateOfficialProps) => void;
};

export const OfficialIndex = (props: OfficialIndexProps) => {
  return (
    <TableLayout
      title="Officials"
      actions={
        <Modal
          button={{ text: "add" }}
          modal={{
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
      }
    >
      <ListOfficials
        officials={props.officials}
        loading={props.loading}
        onEditOfficial={(vals) => props.onEditOfficial(vals)}
      />
    </TableLayout>
  );
};
