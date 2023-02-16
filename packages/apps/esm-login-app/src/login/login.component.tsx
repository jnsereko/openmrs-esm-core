import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useConfig,
  useSession,
  refetchCurrentUser,
  clearCurrentUser,
  getSessionStore,
} from "@openmrs/esm-framework";
import LoginPage from "./login-page.component";

export interface LoginReferrer {
  referrer?: string;
}

export interface LoginProps extends LoginReferrer {
  isLoginEnabled: boolean;
}

const Login: React.FC<LoginProps> = ({ isLoginEnabled }) => {
  const config = useConfig();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigateToLocation = () => {
    console.log(
      "navigating the location from !! Login !! ......................"
    );
    navigate("/login/location", { state: location.state });
    return;
  };

  const user = useMemo(() => {
    return refetchCurrentUser().then(() => {
      const userSession = getSessionStore().getState().session;
      if (userSession.authenticated) {
        console.log(
          "navigating the location fron ## use effect is authenticated......................"
        );
        // navigate("/login/location", { state: location.state });
        setIsLoggedIn(true);
        return userSession.user;
      }
      return null;
    });
  }, []);

  if (config.provider.type === "basic") {
    return (
      <>
        {isLoggedIn && user ? (
          navigateToLocation()
        ) : (
          <LoginPage
            onLogin={(isLoggedIn) => {
              setIsLoggedIn(isLoggedIn);
            }}
            userData={{ user, isLoginEnabled }}
          />
        )}
      </>
    );
  }
};

export default Login;
