// import {
//   createContext,
//   useContext,
//   useEffect,
//   useReducer,
//   ReactNode,
// } from "react";

// import {
//   authReducer,
//   initialAuthState,
//   AuthState,
// } from "./authReducer";

// import { AuthUser } from "../../services/authServices";

// interface AuthContextType extends AuthState {
//   login: (user: AuthUser, accessToken: string) => void;
//   logout: () => void;
// }

// const AuthContext = createContext<AuthContextType | undefined>(
//   undefined
// );

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({
//   children,
// }: AuthProviderProps) => {
//   const [state, dispatch] = useReducer(
//     authReducer,
//     initialAuthState
//   );

//   // Check user after page refresh
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");

//     if (storedUser) {
//       try {
//         const user = JSON.parse(storedUser);

//         dispatch({
//           type: "LOGIN",
//           payload: {
//             user,
//             accessToken: "",
//           },
//         });
//       } catch {
//         localStorage.removeItem("user");

//         dispatch({
//           type: "SET_LOADING",
//           payload: false,
//         });
//       }
//     } else {
//       dispatch({
//         type: "SET_LOADING",
//         payload: false,
//       });
//     }
//   }, []);

//   const login = (
//     user: AuthUser,
//     accessToken: string
//   ) => {
//     // Store only user
//     localStorage.setItem(
//       "user",
//       JSON.stringify(user)
//     );

//     // Access token stays only in React state
//     dispatch({
//       type: "LOGIN",
//       payload: {
//         user,
//         accessToken,
//       },
//     });
//   };

//   const logout = () => {
//     localStorage.removeItem("user");

//     dispatch({
//       type: "LOGOUT",
//     });
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         ...state,
//         login,
//         logout,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);

//   if (!context) {
//     throw new Error(
//       "useAuth must be used inside AuthProvider"
//     );
//   }

//   return context;
// };

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
  refreshAccessToken,
  logoutUser as logoutApi,
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

  // CHECK LOGIN WHEN PAGE REFRESHES
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const newAccessToken = await refreshAccessToken();

        dispatch({
          type: "REFRESH",
          payload: {
            accessToken: newAccessToken,
          },
        });
      } catch (error) {
        console.log("No valid refresh token");

        dispatch({
          type: "FINISH_LOADING",
        });
      }
    };

    restoreSession();
  }, []);

  // LOGIN
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

  // LOGOUT
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("Logout error:", error);
    }

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