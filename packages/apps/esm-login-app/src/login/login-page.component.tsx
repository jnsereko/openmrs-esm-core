import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  InlineNotification,
  PasswordInput,
  TextInput,
  Tile,
} from "@carbon/react";
import { ArrowLeft, ArrowRight } from "@carbon/react/icons";
import { useTranslation } from "react-i18next";
import {
  useConfig,
  interpolateUrl,
  useSession,
  refetchCurrentUser,
  clearCurrentUser,
  getSessionStore,
  LoggedInUser,
} from "@openmrs/esm-framework";
import { performLogin } from "./login.resource";
import styles from "./login.scss";
const hidden: React.CSSProperties = {
  height: 0,
  width: 0,
  border: 0,
  padding: 0,
};

export interface LoginReferrer {
  referrer?: string;
}

export interface LoginPageProps extends LoginReferrer {
  onLogin: (isLoggedIn: boolean) => void;
  userData: { user: any; isLoginEnabled: boolean };
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, userData }) => {
  const config = useConfig();
  const { t } = useTranslation();
  const user = userData.user;
  const isLoginEnabled = userData.isLoginEnabled;
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const showPassword = location.pathname === "/login/confirm";

  useEffect(() => {
    const field = showPassword
      ? passwordInputRef.current
      : usernameInputRef.current;

    if (field) {
      field.focus();
    }
  }, [showPassword]);

  useEffect(() => {
    if (!user && config.provider.type === "oauth2") {
      const loginUrl = config.provider.loginUrl;
      window.location.href = loginUrl;
    }
  }, [config, user]);

  const continueLogin = useCallback(() => {
    const field = usernameInputRef.current;

    if (field.value.length > 0) {
      navigate("/login/confirm", { state: location.state });
    } else {
      field.focus();
    }
  }, [navigate]);

  const changeUsername = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setUsername(evt.target.value),
    []
  );

  const changePassword = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => setPassword(evt.target.value),
    []
  );

  const resetUserNameAndPassword = useCallback(() => {
    setUsername("");
    setPassword("");
  }, []);

  const handleSubmit = useCallback(
    async (evt: React.FormEvent<HTMLFormElement>) => {
      evt.preventDefault();
      evt.stopPropagation();

      if (!showPassword) {
        continueLogin();
        return false;
      }

      try {
        const loginRes = await performLogin(username, password);
        const authData = loginRes.data;
        const valid = authData && authData.authenticated;

        if (!valid) {
          throw new Error("invalidCredentials");
        } else {
          console.log(
            "navigating the location fron handle submit......................"
          );
          onLogin(true);
          return;
        }
      } catch (error) {
        setErrorMessage(error.message);
        resetUserNameAndPassword();
      }

      return false;
    },
    [
      showPassword,
      continueLogin,
      username,
      password,
      onLogin,
      resetUserNameAndPassword,
    ]
  );

  const logo = config.logo.src ? (
    <img
      src={interpolateUrl(config.logo.src)}
      alt={config.logo.alt}
      className={styles["logo-img"]}
    />
  ) : (
    <svg role="img" className={styles["logo"]}>
      <title>OpenMRS logo</title>
      <use xlinkHref="#omrs-logo-full-color"></use>
    </svg>
  );

  return (
    <div className={`canvas ${styles["container"]}`}>
      {errorMessage && (
        <InlineNotification
          kind="error"
          style={{ width: "23rem", marginBottom: "3rem" }}
          /**
           * This comment tells i18n to still keep the following translation keys (used as value for: errorMessage):
           * t('invalidCredentials')
           */
          subtitle={t(errorMessage)}
          title={t("error", "Error")}
          onClick={() => setErrorMessage("")}
        />
      )}
      <Tile className={styles["login-card"]}>
        {showPassword ? (
          <div className={styles["back-button-div"]}>
            <Button
              className={styles["back-button"]}
              iconDescription="Back to username"
              kind="ghost"
              onClick={() => navigate("/login")}
              renderIcon={(props) => (
                <ArrowLeft
                  size={24}
                  style={{ marginRight: "0.5rem" }}
                  {...props}
                />
              )}
            >
              <span>{t("back", "Back")}</span>
            </Button>
          </div>
        ) : null}
        <div className={styles["center"]}>{logo}</div>
        <form onSubmit={handleSubmit} ref={formRef}>
          {!showPassword && (
            <div className={styles["input-group"]}>
              <TextInput
                id="username"
                type="text"
                name="username"
                labelText={t("username", "Username")}
                value={username}
                onChange={changeUsername}
                ref={usernameInputRef}
                autoFocus
                required
              />
              <input
                id="password"
                style={hidden}
                type="password"
                name="password"
                value={password}
                onChange={changePassword}
              />
              <Button
                className={styles.continueButton}
                renderIcon={(props) => <ArrowRight size={24} {...props} />}
                type="submit"
                iconDescription="Continue to login"
                onClick={continueLogin}
                disabled={!isLoginEnabled}
              >
                {t("continue", "Continue")}
              </Button>
            </div>
          )}
          {showPassword && (
            <div className={styles["input-group"]}>
              <input
                id="username"
                type="text"
                name="username"
                style={hidden}
                value={username}
                onChange={changeUsername}
                required
              />

              <PasswordInput
                id="password"
                invalidText={t(
                  "validValueRequired",
                  "A valid value is required"
                )}
                labelText={t("password", "Password")}
                name="password"
                value={password}
                onChange={changePassword}
                ref={passwordInputRef}
                required
                showPasswordLabel="Show password"
              />

              <Button
                type="submit"
                className={styles.continueButton}
                renderIcon={(props) => <ArrowRight size={24} {...props} />}
                iconDescription="Log in"
                disabled={!isLoginEnabled}
              >
                {t("login", "Log in")}
              </Button>
            </div>
          )}
        </form>
      </Tile>
      <div className={styles["need-help"]}>
        <p className={styles["need-help-txt"]}>
          {t("needHelp", "Need help?")}
          <Button kind="ghost">
            {t("contactAdmin", "Contact the site administrator")}
          </Button>
        </p>
      </div>
      <div className={styles["footer"]}>
        <p className={styles["powered-by-txt"]}>
          {t("poweredBy", "Powered by")}
        </p>
        <div>
          <svg role="img" className={styles["powered-by-logo"]}>
            <use xlinkHref="#omrs-logo-partial-mono"></use>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
