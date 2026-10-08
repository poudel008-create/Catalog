import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";

import {
  authReducer,
  initialAuthState,
  AuthState,
} from "./authReducer";

import {
  AuthUser,
  refreshToken,
} from "../../services/authServices";

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

  useEffect(() => {
  const restoreSession = async () => {
    try {
      const result = await refreshToken();

      dispatch({
        type: "LOGIN",
        payload: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      console.log("NO ACTIVE SESSION");

      dispatch({
        type: "SET_LOADING",
        payload: false,
      });
    }
  };

  restoreSession();
}, []);

  const login = (
    user: AuthUser,
    accessToken: string
  ) => {
    dispatch({
      type: "LOGIN",
      payload: {
        user,
        accessToken,
      },
    });
  };

  const logout = () => {
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