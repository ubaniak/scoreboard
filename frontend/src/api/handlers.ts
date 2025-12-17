export type Data<T> = {
  data: T;
};

export type ErrorResponse = {
  error: string;
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

export const HandleErrorResponse = async (
  response: Response
): Promise<ErrorResponse> => {
  if (response.status === 401) {
    return { error: "Forbidden" };
  }
  const json = await response.json();
  if (json.error && typeof json.error === "string") {
    return { error: json.error };
  }
  return { error: "An unknown error occurred" };
};

export const fetchClient = async <T>(
  url: string,
  options?: RequestInit
): Promise<Data<T>> => {
  const res = await fetch(url, { ...options });

  if (res.status === 403 || res.status === 401) {
    // localStorage.removeItem("token");
    // window.location.href = "/login";
    throw new Error("forbidden");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Error");
  }

  return HandleSuccessResponse<T>(res);
};
