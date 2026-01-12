export type ApiType = {
  isLoading: boolean;
};

export type ApiObject = {
  [key: string]: ApiType;
};

export const isApisLoading = (apis: ApiObject) => {
  const values = Object.values(apis);
  return values.some((api) => api.isLoading);
};
