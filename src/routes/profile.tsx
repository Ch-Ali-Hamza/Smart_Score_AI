import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { useAuth, refreshCurrentUser } from "@/lib/auth";
import { adminNav, studentNav, teacherNav } from "@/lib/nav-config";
import { Card, PageHeader } from "@/components/ui-kit";
import { supabase } from "@/lib/supabase";
import { insertLog } from "@/lib/db";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "My Profile — SmartScore AI" }],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(auth?.name ?? "");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!auth) {
      navigate({ to: "/" });
      return;
    }

    async function loadProfile() {
      const { data } = await supabase
        .from("users")
        .select("phone")
        .eq("id", auth!.id)
        .single();

      if (data?.phone) {
        setPhone(data.phone);
      }
    }

    loadProfile();
  }, [auth, navigate]);

  if (!auth) return null;

  const nav =
    auth.role === "admin"
      ? adminNav
      : auth.role === "teacher"
        ? teacherNav
        : studentNav;

  async function handleProfileUpdate(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          name,
          phone,
        })
        .eq("id", auth!.id);

      if (error) {
        throw new Error(error.message);
      }

      await refreshCurrentUser();

      await insertLog({
        user_id: auth!.id,
        action: "Profile updated",
        status: "Success",
      });

      toast.success("Profile updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordChange(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      await insertLog({
        user_id: auth!.id,
        action: "Password changed",
        status: "Success",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      toast.success("Password updated successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell role={auth.role} nav={nav}>
      <PageHeader
        title="My Profile"
        icon={<User className="h-5 w-5 text-brand" />}
      />

      <Card className="mb-6">
        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center gap-2">
            <div className="grid h-32 w-32 place-items-center rounded-full bg-info-soft text-4xl font-bold text-brand">
              {auth.initials}
            </div>

            <button className="text-sm font-medium text-teal hover:underline">
              Change Photo
            </button>
          </div>

          <form
            onSubmit={handleProfileUpdate}
            className="space-y-3"
          >
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Input
              label="Email"
              value={auth.email}
              readOnly
              icon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Department / Class"
              defaultValue="BCS-3A"
              readOnly
            />

            <button
              disabled={savingProfile}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
            >
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </Card>

      <Card title="Change Password">
        <form
          onSubmit={handlePasswordChange}
          className="grid gap-3 sm:grid-cols-3"
        >
          <Input
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="sm:col-span-3">
            <button
              disabled={savingPassword}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground disabled:opacity-60"
            >
              {savingPassword ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Card>
    </AppShell>
  );
}

function Input({
  label,
  icon,
  ...rest
}: {
  label: string;
  icon?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>

      <div
        className={`flex items-center gap-2 rounded-lg border border-input bg-card px-3 ${
          rest.readOnly ? "opacity-70" : ""
        }`}
      >
        {icon && (
          <span className="text-muted-foreground">
            {icon}
          </span>
        )}

        <input
          {...rest}
          className="w-full bg-transparent py-2 text-sm outline-none"
        />
      </div>
    </div>
  );
}
