import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Brain, Lock, Mail, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { login, register, type Role } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { dashboardFor } from "@/components/app-shell";
import campusBg from "@/assets/university-bg.jpg";

export const Route = createFileRoute("/")(
  {
    head: () => ({
      meta: [
        { title: "Sign in — SmartScore AI" },
        {
          name: "description",
          content:
            "Sign in to SmartScore AI to access student performance predictions.",
        },
      ],
    }),
    component: LoginPage,
  }
);

type Mode = "login" | "register";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function validate(): string | null {
    if (mode === "register") {
      if (name.trim().length < 2) return "Enter your full name";
      if (password.length < 6) return "Password must be at least 6 characters";
      if (password !== confirm) return "Passwords do not match";
    }
    return null;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === "register") {
        const result = await register({ role, name, email, password });

        // ── FIX #1: register() can return {requiresEmailConfirmation: true}
        // when Supabase email confirmation is enabled. In that case there is
        // no session yet, so we must NOT try to navigate to a dashboard.
        // Instead, tell the user to confirm their email and switch to login.
        if ("requiresEmailConfirmation" in result && result.requiresEmailConfirmation) {
          toast.success("Account created! Please check your email to confirm before logging in.");
          setName("");
          setPassword("");
          setConfirm("");
          setMode("login");
          return;
        }

        // Normal path — result is a full AuthUser
        toast.success("Account created — welcome!");
        const u = result as { role: "student" | "teacher" | "admin" };
        navigate({ to: dashboardFor(u.role) });

      } else {
        const loggedInUser = await login(email, password);
        toast.success("Logged in successfully!");
        navigate({ to: dashboardFor(loggedInUser.role) });
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Password reset link sent to ${email}`);
    }
  };

  const isRegister = mode === "register";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <header className="mb-6 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-info-soft text-brand">
              <Brain className="h-6 w-6" />
            </span>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              SmartScore AI
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {isRegister
              ? "Create your account"
              : "Student Performance Prediction System"}
          </p>
        </header>

        {/* Mode toggle */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg py-2 font-medium transition-colors ${
              !isRegister
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`rounded-lg py-2 font-medium transition-colors ${
              isRegister
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name — register only */}
          {isRegister && (
            <Field icon={<User className="h-4 w-4" />}>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                maxLength={80}
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>
          )}

          <Field icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              maxLength={120}
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          <Field icon={<Lock className="h-4 w-4" />}>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
            />
          </Field>

          {/* Confirm password — register only */}
          {isRegister && (
            <Field icon={<Lock className="h-4 w-4" />}>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            </Field>
          )}

          {/* ── FIX #2: "Admin" option removed. Admin accounts must be
              created directly in the Supabase dashboard — allowing
              self-registration as Admin is a security risk and the DB
              role constraint will reject it anyway. */}
          {isRegister && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Processing..."
              : isRegister
              ? "Create Account"
              : "Login"}
          </button>

          {!isRegister ? (
            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-medium text-teal hover:underline"
              >
                Forgot Password?
              </button>
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-medium text-teal hover:underline"
              >
                Create account
              </button>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-medium text-teal hover:underline"
              >
                Sign in
              </button>
            </div>
          )}
        </form>

        <footer className="mt-8 text-center text-xs text-muted-foreground">
          COMSATS University — SmartScore AI v1.0
        </footer>
      </div>
    </main>
  );
}

function Field({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-input bg-card px-3 focus-within:border-brand">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}
