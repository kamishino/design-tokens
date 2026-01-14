import { useState } from "react";
import { useAuth } from "./AuthContext";
import { Icons } from "@shared/components/Icons";

export default function LoginView() {
  const { signIn, signInWithOAuth, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = mode === "signin" 
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      setError(error.message);
    } else if (mode === "signup") {
      setMessage("Check your email for the confirmation link!");
    }

    setLoading(false);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setError(null);

    const { error } = await signInWithOAuth(provider);

    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // Don't set loading to false on success - redirect will happen
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg" style={{ width: "400px", maxWidth: "90%" }}>
        <div className="card-body p-4">
          {/* Logo/Title */}
          <div className="text-center mb-4">
            <i className={`${Icons.PALETTE} fs-1 text-primary mb-2`}></i>
            <h2 className="h4 mb-1">Design Token Manager</h2>
            <p className="text-muted small">
              {mode === "signin" ? "Sign in to your account" : "Create a new account"}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="alert alert-danger" role="alert">
              <i className={Icons.ERROR}></i> {error}
            </div>
          )}
          {message && (
            <div className="alert alert-success" role="alert">
              <i className={Icons.SUCCESS}></i> {message}
            </div>
          )}

          {/* OAuth Buttons */}
          <div className="d-grid gap-2 mb-3">
            <button
              type="button"
              className="btn btn-outline-dark d-flex align-items-center justify-content-center gap-2"
              onClick={() => handleOAuth("github")}
              disabled={loading}
            >
              <i className={Icons.GIT}></i>
              Continue with GitHub
            </button>
            <button
              type="button"
              className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2"
              onClick={() => handleOAuth("google")}
              disabled={loading}
            >
              <i className={Icons.BRAND}></i>
              Continue with Google
            </button>
          </div>

          {/* Divider */}
          <div className="position-relative my-3">
            <hr />
            <span
              className="position-absolute top-50 start-50 translate-middle bg-white px-2 text-muted small"
            >
              or
            </span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
              {mode === "signup" && (
                <div className="form-text">Minimum 6 characters</div>
              )}
            </div>

            <div className="d-grid">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Loading...
                  </>
                ) : mode === "signin" ? (
                  "Sign In"
                ) : (
                  "Sign Up"
                )}
              </button>
            </div>
          </form>

          {/* Toggle Mode */}
          <div className="text-center mt-3">
            <button
              type="button"
              className="btn btn-link text-decoration-none"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
                setMessage(null);
              }}
              disabled={loading}
            >
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

