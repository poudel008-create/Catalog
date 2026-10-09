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
const BASE = "https://catalog-jti1.onrender.com/api";


export const loginUser = async (
  loginData: LoginData
): Promise<LoginResponse> => {
  const response = await fetch(`${BASE}/auth/login`, {
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

export const logoutUser = async () => {
  const response = await fetch(`${BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Logout failed");
  }

  return data;
};

export const refreshToken = async () => {
  const response = await fetch(`${BASE}/auth/refresh-token`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Session expired"
    );
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