import { useGetCurrent } from "../api/current";
import { JudgeIndex } from "../components/judge";
import { PageLayout } from "../layouts/page";
import { useProfile } from "../providers/login";

export const JudgePage = () => {
  const { token } = useProfile();
  const current = useGetCurrent();

  return (
    <PageLayout title="Judge" subTitle={current.data?.card?.name}>
      {token}
      <JudgeIndex current={current.data} />
    </PageLayout>
  );
};
