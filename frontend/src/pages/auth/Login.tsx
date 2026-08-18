import { useEffect, useState, useRef, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";

/* ── Animated floating orbs for the hero panel ── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <div className="login-orb login-orb--3" />
    </div>
  );
}

/* ── Stat pill shown in the hero panel ── */
function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full bg-white/[0.06] backdrop-blur-sm border border-white/[0.08] px-4 py-2">
      <span className="text-sm font-semibold text-white">{value}</span>
      <span className="text-xs text-white/60">{label}</span>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    "/dashboard";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  useEffect(() => {
    setMounted(true);
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    try {
      setError(null);
      setLoading(true);
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to sign in. Please verify your credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="flex min-h-screen">
      {/* ────────────────── LEFT HERO PANEL ────────────────── */}
      <div
        className={`
          login-hero relative hidden lg:flex lg:w-[52%] flex-col justify-between p-10 xl:p-14
          transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}
        `}
      >
        <FloatingOrbs />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-white font-bold text-base border border-white/[0.12]">
              CH
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Creator Hunter
            </span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-lg">
          <h1
            className={`
              text-[2.5rem] xl:text-[3rem] font-bold leading-[1.1] tracking-tight text-white
              transition-all duration-700 delay-200 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
            `}
          >
            Find the perfect
            <br />
            <span className="login-hero-gradient">creators</span> for
            <br />
            your brand
          </h1>
          <p
            className={`
              mt-5 text-base text-white/65 leading-relaxed max-w-sm
              transition-all duration-700 delay-300 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
            `}
          >
            AI-powered discovery, audience analytics, and campaign management
            — all in one platform built for modern agencies.
          </p>

          {/* Stat pills */}
          <div
            className={`
              mt-8 flex flex-wrap gap-3
              transition-all duration-700 delay-500 ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
            `}
          >
            <StatPill value="500" label="Creators" />
            <StatPill value="14" label="Cities" />
            <StatPill value="10" label="Categories" />
          </div>
        </div>

        {/* Testimonial */}
        <div
          className={`
            relative z-10 max-w-md
            transition-all duration-700 delay-[600ms] ${mounted ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
          `}
        >
          <div className="rounded-2xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08] p-5">
            <p className="text-sm text-white/80 leading-relaxed italic">
              &ldquo;Creator Hunter cut our influencer sourcing time by 80%.
              The AI ranking is incredibly accurate.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-white font-semibold">
                SP
              </div>
              <div>
                <p className="text-xs font-medium text-white/90">
                  Sarah Park
                </p>
                <p className="text-[11px] text-white/50">
                  Head of Influencer Marketing, Acme Brands
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────── RIGHT FORM PANEL ────────────────── */}
      <div className="flex flex-1 flex-col justify-center bg-paper px-6 sm:px-12 lg:px-16 xl:px-20">
        <div
          className={`
            mx-auto w-full max-w-[400px]
            transition-all duration-600 delay-100 ${mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
          `}
        >
          {/* Mobile brand (shown only on smaller screens) */}
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-soft text-teal font-bold text-sm border border-teal/20">
                CH
              </div>
              <span className="font-semibold text-ink text-base tracking-tight">
                Creator Hunter
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-ink">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-danger-soft p-3.5 text-sm text-danger border border-danger/10">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.25a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm.75 6.5a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email address
              </label>
              <input
                ref={emailRef}
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="login-input"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-teal hover:underline font-medium"
                  tabIndex={-1}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="login-input pr-10"
                  autoComplete="current-password"
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
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="login-btn w-full py-3 text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-7 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-steel-500">
              Quick access
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo credential buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                fillCredentials("demo@creatorhunter.app", "Password123!")
              }
              className="login-demo-btn group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-soft text-teal text-xs font-bold group-hover:scale-105 transition-transform">
                DU
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold text-ink leading-tight">
                  Demo User
                </span>
                <span className="text-[11px] text-ink-secondary">
                  Owner role
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() =>
                fillCredentials("admin@creatorhunter.app", "AdminPass123!")
              }
              className="login-demo-btn group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-soft text-indigo text-xs font-bold group-hover:scale-105 transition-transform">
                AD
              </div>
              <div className="text-left">
                <span className="block text-sm font-semibold text-ink leading-tight">
                  Admin User
                </span>
                <span className="text-[11px] text-ink-secondary">
                  Admin role
                </span>
              </div>
            </button>
          </div>

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-ink-secondary">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-teal hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
