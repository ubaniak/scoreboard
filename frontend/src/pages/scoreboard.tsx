import { useGetCurrent } from "../api/current";
import { ShowCurrent } from "../components/current/current";
import { ScoreboardLayout } from "../layouts/scoreboard";

export const ScoreboardPage = () => {
  const current = useGetCurrent();
  return (
    <ScoreboardLayout>
      <ShowCurrent current={current.data} />
    </ScoreboardLayout>
  );
};
