import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { AuthBrandMark } from "../../components/auth/AuthBrandMark";
import { AuthHeroPanel } from "../../components/auth/AuthHeroPanel";
import { useAuth } from "../../context/AuthContext";

const FEATURES = [
  "AI-powered creator matching & ranking",
  "Multi-platform campaign management",
  "Real-time audience analytics & insights",
];

function FeatureChecklist() {
  return (
    <div className="space-y-2.5">
      {FEATURES.map((feat) => (
        <div key={feat} className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white/90">
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z" />
            </svg>
          </div>
          <span className="text-sm text-white/75">{feat}</span>
        </div>
      ))}
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const { user, register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("CAMPAIGN_MANAGER");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => setMounted(true), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await register({ name, email, password, company, role });
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Registration failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AuthHeroPanel
        eyebrow="AI-Powered Platform"
        headline={
          <>
            Start discovering
            <br />
            <span className="login-hero-gradient">top creators</span>
            <br />
            today
          </>
        }
        subcopy="Join brands and agencies using AI-powered analytics to find and partner with the right creators."
        bottomContent={<FeatureChecklist />}
      />

      {/* ────────────────── RIGHT FORM PANEL ────────────────── */}
      <div className="flex flex-1 flex-col justify-center bg-paper px-6 sm:px-12 lg:px-16 xl:px-20">
        <div
          className={`
            mx-auto w-full max-w-[400px]
            transition-all duration-600 delay-100 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
          `}
        >
          {/* Mobile brand */}
          <div className="mb-8 lg:hidden">
            <AuthBrandMark size="sm" />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Get started with Creator Hunter in seconds
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-danger-soft p-3.5 text-sm text-danger border border-danger/10">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.25a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm.75 6.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Full Name <span className="text-danger">*</span>
                </label>
                <input
                  id="register-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Morgan"
                  className="login-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Company
                </label>
                <input
                  id="register-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Brands"
                  className="login-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email address <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-secondary" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2.5" y="4.5" width="15" height="11" rx="1.5" />
                  <path d="M3 5.5l7 5.5 7-5.5" />
                </svg>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@agency.com"
                  className="login-input pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Password <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-secondary" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="4.5" y="8.5" width="11" height="8" rx="1.5" />
                  <path d="M6.5 8.5V6a3.5 3.5 0 017 0v2.5" />
                </svg>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="login-input pl-9 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Select
              label="Role"
              id="register-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="CAMPAIGN_MANAGER">Campaign Manager</option>
              <option value="OWNER">Brand Owner</option>
              <option value="RESEARCHER">Talent Researcher</option>
              <option value="ADMIN">Platform Administrator</option>
            </Select>

            <Button
              type="submit"
              disabled={loading}
              className="login-btn w-full py-3 text-sm font-semibold mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-ink-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-teal hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
