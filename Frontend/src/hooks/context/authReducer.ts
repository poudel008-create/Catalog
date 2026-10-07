import { AuthUser } from "../../services/authServices";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export type AuthAction =
  | {
      type: "LOGIN";
      payload: {
        user: AuthUser;
        accessToken: string;
      };
    }
  | {
      type: "LOGOUT";
    }
  | {
      type: "SET_LOADING";
      payload: boolean;
    };

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  loading: true,
};

export const authReducer = (
  state: AuthState,
  action: AuthAction
): AuthState => {
  switch (action.type) {
    case "LOGIN":
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        loading: false,
      };

    case "LOGOUT":
      return {
        ...initialAuthState,
        loading: false,
      };

    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};