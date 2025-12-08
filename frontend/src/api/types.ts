export type Data<T> = {
  data: T;
};

export type ErrorResponse = {
  error: string;
};

export const ParseSuccessResponse = async <T>(
  response: Response
): Promise<Data<T>> => {
  const json = await response.json();
  return json as Data<T>;
};

export const ParseErrorResponse = async (
  response: Response
): Promise<ErrorResponse> => {
  if (response.status === 403) {
    return { error: "Forbidden" };
  }
  const json = await response.json();
  if (json.error && typeof json.error === "string") {
    return { error: json.error };
  }
  return { error: "An unknown error occurred" };
};
