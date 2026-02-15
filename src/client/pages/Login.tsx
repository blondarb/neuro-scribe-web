/**
 * Login Page — Dev mode: paste a JWT token. Production: OAuth redirect.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [inputToken, setInputToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Already logged in
  if (token) {
    navigate("/encounters", { replace: true });
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = inputToken.trim();
    if (!trimmed) {
      setError("Token is required");
      return;
    }

    // Basic JWT format check (three dot-separated parts)
    if (trimmed.split(".").length !== 3) {
      setError("Invalid JWT format");
      return;
    }

    login(trimmed);
    navigate("/encounters", { replace: true });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4, color: "var(--color-primary)" }}>
          Neuro Scribe
        </h1>
        <p style={{ color: "var(--color-text-secondary)", marginBottom: 32, fontSize: 14 }}>
          AI-powered clinical documentation for neurology
        </p>

        <div className="card">
          <h2 style={{ fontSize: 16, marginBottom: 16 }}>Developer Login</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 16 }}>
            Paste a JWT token generated with <code style={{ background: "var(--color-bg)", padding: "2px 6px", borderRadius: 4 }}>make token</code>
          </p>

          <form onSubmit={handleSubmit}>
            <textarea
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              rows={3}
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, marginBottom: 12 }}
            />
            {error && (
              <div style={{ color: "var(--color-danger)", fontSize: 13, marginBottom: 12 }}>{error}</div>
            )}
            <button className="btn btn-primary" style={{ width: "100%" }} type="submit">
              Sign In
            </button>
          </form>
        </div>

        <p style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 16, textAlign: "center" }}>
          Production deployments use OAuth 2.0 / OIDC for authentication.
        </p>
      </div>
    </div>
  );
}
