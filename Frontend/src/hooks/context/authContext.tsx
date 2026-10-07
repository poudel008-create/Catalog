import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";

import {authReducer, initialAuthState, AuthState} from "./authReducer";

import { AuthUser } from "../../services/authServices";

interface AuthContextType extends AuthState {
  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [state, dispatch] = useReducer(
    authReducer,
    initialAuthState
  );

  // Check login after page refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("accessToken");

    if (storedUser && storedToken) {
      try {
        const user = JSON.parse(storedUser);

        dispatch({
          type: "LOGIN",
          payload: {
            user,
            accessToken: storedToken,
          },
        });
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");

        dispatch({
          type: "SET_LOADING",
          payload: false,
        });
      }
    } else {
      dispatch({
        type: "SET_LOADING",
        payload: false,
      });
    }
  }, []);

  const login = (
    user: AuthUser,
    accessToken: string
  ) => {
    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );

    localStorage.setItem(
      "accessToken",
      accessToken
    );

    dispatch({
      type: "LOGIN",
      payload: {
        user,
        accessToken,
      },
    });
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");

    dispatch({
      type: "LOGOUT",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};