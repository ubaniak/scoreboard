import { Segmented } from "antd";
import { useState } from "react";
import type { AffiliationType, CreateAffiliationProps } from "../../api/affiliations";
import { BulkAddQueue } from "../shared/BulkAddQueue";
import { ImportCSV } from "../shared/ImportCSV";
import { AddAffiliation } from "./AddAffiliation";
import { AffiliationFields } from "./AffiliationFields";

const TEMPLATE = "name,type\nCity Boxing Club,club\nOntario,province\nCanada,nation";

export type AddAffiliationShellProps = {
  defaultType?: AffiliationType;
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (v: CreateAffiliationProps) => Promise<unknown>;
  onImport: (file: File) => Promise<unknown>;
};

type Mode = "single" | "bulk" | "import";

export const AddAffiliationShell = (props: AddAffiliationShellProps) => {
  const [mode, setMode] = useState<Mode>("single");

  return (
    <div>
      <Segmented
        value={mode}
        onChange={(v) => setMode(v as Mode)}
        style={{ marginBottom: 20 }}
        options={[
          { value: "single", label: "Add" },
          { value: "bulk", label: "Add Bulk" },
          { value: "import", label: "Upload CSV" },
        ]}
      />

      {mode === "single" && (
        <AddAffiliation defaultType={props.defaultType} onClose={props.onClose} onSubmit={props.onSubmit} />
      )}

      {mode === "bulk" && (
        <BulkAddQueue<CreateAffiliationProps>
          onClose={props.onClose}
          onSubmitAll={async (items) => {
            for (const item of items) {
              await props.onSubmit(item);
            }
          }}
          renderFields={() => <AffiliationFields />}
          renderQueueItem={(item) => `${item.name} (${item.type})`}
          initialValues={{ type: props.defaultType ?? "club" }}
        />
      )}

      {mode === "import" && (
        <ImportCSV
          onClose={props.onClose}
          onImport={props.onImport}
          hint="Required columns: name, type (club | province | nation)"
          template={{ filename: "affiliations-template.csv", content: TEMPLATE }}
        />
      )}
    </div>
  );
};
