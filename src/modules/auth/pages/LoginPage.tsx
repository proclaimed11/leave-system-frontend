import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "../AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.error || err?.message || "Login failed. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      {/* Base gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f2258] to-[#14287a]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent dark:from-black/60"
        aria-hidden
      />

      {/* Accent orbs */}
      <div
        className="pointer-events-none absolute -top-24 right-0 h-[28rem] w-[28rem] translate-x-1/4 animate-pulse rounded-full bg-cyan-400/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[22rem] w-[22rem] -translate-x-1/4 translate-y-1/4 rounded-full bg-violet-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400/15 blur-3xl"
        aria-hidden
      />

      {/* Fine grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
            <Sparkles className="h-7 w-7 text-amber-200" strokeWidth={1.75} />
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
            LMS
          </h1>
          <p className="mt-2 text-base text-white/85 sm:text-lg">
            Leave Management System
          </p>
          <p className="mt-1 text-sm text-white/60">Sign in to continue</p>
        </header>

        <Card className="border-white/25 bg-white/92 shadow-2xl shadow-black/25 ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-black/50 dark:ring-white/10">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              Welcome back
            </CardTitle>
            <CardDescription className="text-base">
              Use your work email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4 pt-1">
              <div className="space-y-2">
                <label htmlFor="login-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-slate-200/80 bg-white/80 shadow-sm transition-[box-shadow,border-color] focus-visible:border-[#14287a]/50 focus-visible:ring-[#14287a]/25 dark:border-slate-700 dark:bg-slate-900/80"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 border-slate-200/80 bg-white/80 pr-11 shadow-sm transition-[box-shadow,border-color] focus-visible:border-[#14287a]/50 focus-visible:ring-[#14287a]/25 dark:border-slate-700 dark:bg-slate-900/80"
                    required
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error ? (
                <p
                  className="rounded-lg border border-red-200/80 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <Button
                type="submit"
                className="mt-2 h-11 w-full gap-2 text-base font-semibold shadow-lg shadow-[#14287a]/35 transition-[box-shadow,transform] hover:shadow-xl hover:shadow-[#14287a]/40 active:scale-[0.99]"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span
                      className="size-4 shrink-0 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                      aria-hidden
                    />
                    Signing in…
                  </>
                ) : (
                  <>
                    <LogIn className="size-4 shrink-0" aria-hidden />
                    Sign in
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
