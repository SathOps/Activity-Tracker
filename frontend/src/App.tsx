import { useEffect, useState } from "react";
import DashboardHome from "./components/dashboard/DashboardHome";
import type { Intern } from "./components/intern/InternSearch";
import { configureCorpusService } from "./services/corpus";

const ACCESS_TOKEN_STORAGE_KEY = "corpus_access_token";
const USERNAME_STORAGE_KEY = "corpus_username";

export default function App() {
  const [addedInterns, setAddedInterns] = useState<Intern[]>([]);
  const [authToken, setAuthToken] = useState(() => readStoredAccessToken());
  const [username, setUsername] = useState(() => readStoredUsername());
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    // Browser requests use relative /api/v1 routes via Vite proxy.
    configureCorpusService({ baseUrl: "", useMock: false, authToken });
  }, [authToken]);

  useEffect(() => {
    persistAccessToken(authToken);
  }, [authToken]);
  useEffect(() => {
    persistUsername(username);
  }, [username]);

  const handleRemoveIntern = (internId: string) => {
    setAddedInterns((prev) => prev.filter((i) => i.id !== internId));
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedPhone = phone.trim();
    const nextPassword = password.trim();

    if (!trimmedPhone || !nextPassword) {
      setLoginError("Phone number and password are required.");
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const phoneCandidates = buildLoginPhoneCandidates(trimmedPhone);
      let payload: unknown = null;
      let lastErrorMessage = "";
      let lastStatus = 0;

      for (const loginPhone of phoneCandidates) {
        const response = await fetch("/api/v1/auth/login", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: loginPhone,
            password: nextPassword,
          }),
        });

        if (response.ok) {
          payload = (await response.json()) as unknown;
          break;
        }

        lastStatus = response.status;
        lastErrorMessage = await extractErrorMessage(response);
      }

      if (!payload) {
        setLoginError(lastErrorMessage || `Login failed (${lastStatus || "unknown"}).`);
        return;
      }

      const accessToken = readAccessToken(payload);

      if (!accessToken) {
        setLoginError("Login succeeded but access token was not found in response.");
        return;
      }

      setAuthToken(accessToken);
      setUsername(trimmedPhone);
      setPassword("");
      setLoginError(null);
    } catch (error) {
      console.error("Login request failed", error);
      setLoginError("Unable to reach the login endpoint. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAuthToken("");
    setUsername("");
    setAddedInterns([]);
    setPassword("");
    setLoginError(null);
    setIsProfileMenuOpen(false);
  };

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handleDocumentClick = () => {
      setIsProfileMenuOpen(false);
    };

    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [isProfileMenuOpen]);

  if (!authToken) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1 className="auth-title">Corpus Login</h1>
          <p className="auth-subtitle">Login with phone number and password to open dashboard.</p>
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-label">
              Phone Number
              <input
                autoComplete="tel"
                className="auth-input"
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Enter phone number"
                type="tel"
                value={phone}
              />
            </label>
            <label className="auth-label">
              Password
              <input
                autoComplete="current-password"
                className="auth-input"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                type="password"
                value={password}
              />
            </label>
            {loginError ? <p className="auth-error">{loginError}</p> : null}
            <button className="primary-button auth-submit" disabled={isLoggingIn} type="submit">
              {isLoggingIn ? "Logging in..." : "Login"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-toolbar">
        <div className="profile-menu-container">
          <button
            aria-label="Open profile menu"
            className="profile-icon-button"
            onClick={(event) => {
              event.stopPropagation();
              setIsProfileMenuOpen((prev) => !prev);
            }}
            type="button"
          >
            <span aria-hidden="true">👤</span>
          </button>

          {isProfileMenuOpen ? (
            <div
              className="profile-menu-dropdown"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <div className="profile-menu-label">User Number</div>
              <div className="profile-menu-id">{username || "Unavailable"}</div>
              <button className="secondary-button profile-menu-logout" onClick={handleLogout} type="button">
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <DashboardHome
        addedInterns={addedInterns}
        authToken={authToken}
        onInternsChange={setAddedInterns}
        onRemoveIntern={handleRemoveIntern}
      />
    </div>
  );
}

function readStoredAccessToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? "";
}

function persistAccessToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
}

function readStoredUsername(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(USERNAME_STORAGE_KEY) ?? "";
}

function persistUsername(username: string): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!username) {
    window.localStorage.removeItem(USERNAME_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(USERNAME_STORAGE_KEY, username);
}

function readAccessToken(payload: unknown): string {
  if (!isRecord(payload)) {
    return "";
  }

  const directToken = asString(payload.access_token);

  if (directToken) {
    return directToken;
  }

  if (!isRecord(payload.data)) {
    return "";
  }

  return asString(payload.data.access_token);
}

function buildLoginPhoneCandidates(rawPhone: string): string[] {
  const trimmed = rawPhone.trim();
  const compact = trimmed.replace(/\s+/g, "");
  const digitsOnly = compact.replace(/\D/g, "");
  const candidates: string[] = [];

  if (compact) {
    candidates.push(compact);
  }

  // India convenience: allow login with 10 digits by auto-trying +91 prefix.
  if (!compact.startsWith("+")) {
    if (digitsOnly.length === 10) {
      candidates.push(`+91${digitsOnly}`);
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
      candidates.push(`+${digitsOnly}`);
    }
  }

  return Array.from(new Set(candidates));
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;

    if (typeof payload === "string") {
      return payload.trim();
    }

    if (!isRecord(payload)) {
      return "";
    }

    const detail = payload.detail;

    if (typeof detail === "string") {
      return detail.trim();
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((entry) => {
          if (typeof entry === "string") {
            return entry;
          }

          if (isRecord(entry)) {
            return asString(entry.msg) || asString(entry.message) || "";
          }

          return "";
        })
        .filter((message) => message.length > 0)
        .join(", ");
    }

    return asString(payload.message);
  } catch {
    return "";
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
