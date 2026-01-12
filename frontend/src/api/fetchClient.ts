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
  try {
    const json = await response.json();
    if (Object.keys(json).length === 0) {
      console.log("Received empty JSON response.");
      return {} as Data<T>;
    }
    return json as Data<T>;
  } catch {
    return {} as Data<T>;
  }
};
