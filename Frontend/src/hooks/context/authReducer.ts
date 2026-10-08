import { AuthUser } from "../../services/authServices";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  accessToken: null,
  loading: true,
};

type AuthAction =
  | {
      type: "LOGIN";
      payload: {
        user: AuthUser;
        accessToken: string;
      };
    }
  | {
      type: "REFRESH";
      payload: {
        accessToken: string;
      };
    }
  | {
      type: "LOGOUT";
    }
  | {
      type: "FINISH_LOADING";
    };

export const authReducer = (
  state: AuthState,
  action: AuthAction
): AuthState => {
  switch (action.type) {
    case "LOGIN":
      return {
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        loading: false,
      };

    case "REFRESH":
      return {
        ...state,
        accessToken: action.payload.accessToken,
        loading: false,
      };

    case "LOGOUT":
      return {
        user: null,
        accessToken: null,
        loading: false,
      };

    case "FINISH_LOADING":
      return {
        ...state,
        loading: false,
      };

    default:
      return state;
  }
};