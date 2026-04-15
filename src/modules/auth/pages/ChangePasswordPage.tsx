import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { changePassword } from "../api/authApi";
import { useAuth } from "../AuthContext";

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { rehydrateFromTokens } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    setSubmitting(true);
    try {
      const result = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      await rehydrateFromTokens(result.token, result.refreshToken);
      toast.success("Password updated");
      void navigate("/", { replace: true });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? String(err.response?.data?.error ?? err.message)
        : err instanceof Error
          ? err.message
          : "Could not update password";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden p-4 sm:p-6">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0f2258] to-[#14287a]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent dark:from-black/60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 right-0 h-[28rem] w-[28rem] translate-x-1/4 animate-pulse rounded-full bg-cyan-400/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[22rem] w-[22rem] -translate-x-1/4 translate-y-1/4 rounded-full bg-violet-500/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:48px_48px]"
        aria-hidden
      />

      <div className="relative z-10 w-full max-w-md">
        <header className="mb-8 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
            Set New Password
          </h1>
          <p className="mt-2 text-base text-white/85">
            Update your temporary password to continue
          </p>
        </header>

        <Card className="border-white/25 bg-white/92 shadow-2xl shadow-black/25 ring-1 ring-white/30 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-black/50 dark:ring-white/10">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              Choose a new password
            </CardTitle>
            <CardDescription className="text-base">
              Your account was created with a temporary password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="current-password">
                  Current password
                </label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-11 border-slate-200/80 bg-white/80 pr-11 shadow-sm transition-[box-shadow,border-color] focus-visible:border-[#14287a]/50 focus-visible:ring-[#14287a]/25 dark:border-slate-700 dark:bg-slate-900/80"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                    onClick={() => setShowCurrent((v) => !v)}
                    aria-label={showCurrent ? "Hide password" : "Show password"}
                  >
                    {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="new-password">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? "text" : "password"}
                    placeholder="New password (min. 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11 border-slate-200/80 bg-white/80 pr-11 shadow-sm transition-[box-shadow,border-color] focus-visible:border-[#14287a]/50 focus-visible:ring-[#14287a]/25 dark:border-slate-700 dark:bg-slate-900/80"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                    onClick={() => setShowNew((v) => !v)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                  >
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-11 border-slate-200/80 bg-white/80 shadow-sm transition-[box-shadow,border-color] focus-visible:border-[#14287a]/50 focus-visible:ring-[#14287a]/25 dark:border-slate-700 dark:bg-slate-900/80"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="mt-2 h-11 w-full text-base font-semibold shadow-lg shadow-[#14287a]/35 transition-[box-shadow,transform] hover:shadow-xl hover:shadow-[#14287a]/40 active:scale-[0.99]"
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
