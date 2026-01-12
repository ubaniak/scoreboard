export type ShowProps = {
  show: boolean;
  children: React.ReactNode;
};
export const Show = ({ show, children }: ShowProps) => {
  return <>{show && children}</>;
};
