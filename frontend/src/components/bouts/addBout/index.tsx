import { Segmented } from "antd";
import { useState } from "react";
import type { CreateBoutProps } from "../../../api/bouts";
import type { Athlete } from "../../../api/athletes";
import type { Bout } from "../../../entities/cards";
import { BulkPair } from "./BulkPair";
import { ImportPanel } from "./ImportPanel";
import { ManualFlow } from "./ManualFlow";

export type AddBoutProps = {
  onClose: (promise?: Promise<unknown>) => void;
  onSubmit: (values: CreateBoutProps) => Promise<unknown>;
  onImport: (file: File) => Promise<unknown>;
  athletes?: Athlete[];
  availableAthleteIds?: number[];
  nextBoutNumber?: number;
  bouts?: Bout[];
};

type Mode = "manual" | "bulk" | "import";

export const AddBout = (props: AddBoutProps) => {
  const [mode, setMode] = useState<Mode>("manual");

  return (
    <div>
      <Segmented
        value={mode}
        onChange={(value) => setMode(value as Mode)}
        style={{ marginBottom: 20 }}
        options={[
          { value: "manual", label: "Manual" },
          { value: "bulk", label: "Bulk Pair" },
          { value: "import", label: "Import" },
        ]}
      />

      {mode === "manual" && (
        <ManualFlow
          onClose={props.onClose}
          onSubmit={props.onSubmit}
          athletes={props.athletes}
          availableAthleteIds={props.availableAthleteIds}
          nextBoutNumber={props.nextBoutNumber}
          bouts={props.bouts}
        />
      )}
      {mode === "bulk" && (
        <BulkPair
          onClose={props.onClose}
          onSubmit={props.onSubmit}
          athletes={props.athletes}
          availableAthleteIds={props.availableAthleteIds}
          nextBoutNumber={props.nextBoutNumber}
          bouts={props.bouts}
        />
      )}
      {mode === "import" && <ImportPanel onClose={props.onClose} onImport={props.onImport} />}
    </div>
  );
};
