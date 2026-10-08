export interface LoginData {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: "user" | "recruiter" | "admin";
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

const API_URL = "http://localhost:5000/api/auth";

export const loginUser = async (
  loginData: LoginData
): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(loginData),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return {
    user: {
      id: data.user.id,
      fullName: data.user.name,
      email: data.user.email,
      role: data.user.role,
    },
    accessToken: data.token,
  };
};


export const refreshAccessToken = async (): Promise<string> => {
  const response = await fetch(
    "http://localhost:5000/api/auth/refresh",
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Refresh token expired");
  }

  return data.accessToken;
};

export const logoutUser = async () => {
  const response = await fetch(`${API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Logout failed");
  }

  return data;
};