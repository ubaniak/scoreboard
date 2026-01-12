import { useEffect, useState } from "react";
import type { ApiObject, ApiType } from "../../api/handlers";
import { LoadingProgress, type ProgressStep } from "./loadingProgress";

type StepProgressProps = {
  apis: ApiObject;
};

export const ApiLoading = ({ apis }: StepProgressProps) => {
  const [steps, setSteps] = useState<ProgressStep[]>([]);
  useEffect(() => {
    const getStates = () => {
      const entries = Object.entries(apis);

      setSteps(
        entries.map((entry) => {
          return { label: entry[0], isLoading: entry[1].isLoading };
        })
      );
    };
    getStates();
  }, [apis]);

  if (steps.some((step) => step.isLoading)) {
    return <LoadingProgress steps={steps} />;
  }

  return undefined;
};
