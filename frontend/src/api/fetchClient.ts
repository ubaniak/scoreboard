import type { Data } from "./types";

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
  public get Status() {
    return this.status;
  }
}

export const fetchClient = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new ApiError(await res.text(), res.status);
  }

  const data = await HandleSuccessResponse<T>(res);
  return data.data;
};

export const HandleSuccessResponse = async <T>(
  response: Response
): Promise<Data<T>> => {
  const text = await response.text();
  if (!text) {
    return {} as Data<T>;
  }
  const json = JSON.parse(text) as Data<T>;
  if (Object.keys(json).length === 0) {
    return {} as Data<T>;
  }
  return json;
};
