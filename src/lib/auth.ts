import { useSyncExternalStore } from "react";
import { supabase } from "./supabase";
import { insertLog } from "./db";

export type Role = "student" | "teacher" | "admin";

export type AuthUser = {
  id: string;
  role: Role;
  name: string;
  initials: string;
  email: string;
};

const KEY = "smartscore.auth";
const listeners = new Set<() => void>();

let cachedRaw: string | null = null;
let cachedUser: AuthUser | null = null;

function read(): AuthUser | null {
  if (typeof window === "undefined") return null;

  let raw: string | null = null;

  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return cachedUser;
  }

  if (raw === cachedRaw) return cachedUser;

  cachedRaw = raw;

  try {
    cachedUser = raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    cachedUser = null;
  }

  return cachedUser;
}

function emit() {
  listeners.forEach((l) => l());
}

function makeInitials(name: string) {
  const parts = name.trim().split(/\s+/);

  return (
    (parts[0]?.[0] ?? "U") +
    (parts[1]?.[0] ?? "")
  ).toUpperCase();
}

function normalizeRole(role: unknown): Role {
  return role === "admin" || role === "teacher" || role === "student" ? role : "student";
}

async function createProfileFromAuthUser(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}) {
  const name = typeof authUser.user_metadata?.name === "string" ? authUser.user_metadata.name : "User";
  const role = normalizeRole(authUser.user_metadata?.role);
  const email = authUser.email ?? "";

  const { data, error } = await supabase
    .from("users")
    .upsert({ id: authUser.id, name, email, role }, { onConflict: "id" })
    .select("id, name, email, role")
    .single();

  if (error) throw new Error("Failed to save profile: " + error.message);

  if (role === "student") {
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (!existingStudent) {
      const { error: studentError } = await supabase.from("students").insert({
        user_id: authUser.id,
        student_id_number: "ST-" + Date.now().toString().slice(-6),
        class: "Unassigned",
        section: "A",
      });

      if (studentError) throw new Error("Failed to create student record: " + studentError.message);
    }
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// AUTH STATE CHANGE HANDLER
//
// FIX #3: Replaced the old one-liner handler that only cleared
// state on logout. The new handler does two things:
//
// 1. SIGNED_IN — when a user confirms their email and Supabase
//    fires this event, we check if their profile row exists in
//    the `users` table. If it doesn't (because the email-
//    confirmation path skipped the DB inserts), we create it
//    now using the name/role saved in user_metadata during
//    signUp. This is what makes email-confirmation flow work
//    end-to-end without hitting "Account setup incomplete."
//
// 2. No session — same as before: clear local auth state.
// ─────────────────────────────────────────────────────────────
supabase.auth.onAuthStateChange((_event, session) => {
  // No session — user logged out or session expired
  if (!session) {
    if (typeof window !== "undefined") {
      try { localStorage.removeItem(KEY); } catch {}
    }
    cachedRaw = null;
    cachedUser = null;
    emit();
  }
});

// ─────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const trimmedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: trimmedEmail,
    password,
  });

  if (error) {
    void insertLog({
      user_id: null,
      action: `Failed login attempt for ${trimmedEmail}`,
      status: "Failed",
    }).catch(() => null);

    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Login failed");
  }

  const { data: userData, error: dbError } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (dbError || !userData) {
    await supabase.auth.signOut();

    throw new Error(
      "Account setup incomplete. Please contact support.",
    );
  }

  const user: AuthUser = {
    id: data.user.id,
    role: userData.role as Role,
    name: userData.name,
    initials: makeInitials(userData.name),
    email: userData.email,
  };

  localStorage.setItem(KEY, JSON.stringify(user));

  cachedRaw = JSON.stringify(user);
  cachedUser = user;

  void insertLog({
    user_id: data.user.id,
    action: "User login",
    status: "Success",
  }).catch(() => null);

  emit();

  return user;
}

// ─────────────────────────────────────────────────────────────
// REGISTER
//
// FIX #3: Pass name and role into supabase.auth.signUp() as
// user_metadata via options.data. This ensures that when the
// user later confirms their email, onAuthStateChange can read
// these values back and create the profile rows correctly.
//
// The DB inserts (users + students) only run when email
// confirmation is OFF (data.session is non-null). When it IS
// on, they are deferred to onAuthStateChange above.
// ─────────────────────────────────────────────────────────────
export async function register(input: {
  role: Role;
  name: string;
  email: string;
  password: string;
}) {
  const trimmedName = input.name.trim() || "User";
  const trimmedEmail = input.email.trim().toLowerCase();

  // (duplicate-email pre-check removed — supabase.auth.signUp will reject duplicates,
  // and the users insert is an upsert. Skipping this saves one round-trip.)

  // FIX: store name + role in user_metadata so onAuthStateChange
  // can use them after email confirmation
  const { data, error } = await supabase.auth.signUp({
    email: trimmedEmail,
    password: input.password,
    options: {
      data: {
        name: trimmedName,
        role: input.role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Registration failed");
  }

  // Email confirmation is ON — DB inserts deferred to
  // onAuthStateChange. Return the flag so the UI can show the
  // "check your email" message instead of navigating.
  if (!data.session) {
    return {
      requiresEmailConfirmation: true as const,
    };
  }

  // Email confirmation is OFF — upsert so we don't race with the
  // onAuthStateChange SIGNED_IN handler which may have already
  // inserted the profile row from user_metadata.
  const { error: userError } = await supabase
    .from("users")
    .upsert(
      {
        id: data.user.id,
        name: trimmedName,
        email: trimmedEmail,
        role: input.role,
      },
      { onConflict: "id" },
    );

  if (userError) {
    throw new Error(
      "Failed to save profile: " + userError.message,
    );
  }

  if (input.role === "student") {
    // Only create a student record if one doesn't already exist
    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();

    const studentIdNumber =
      "ST-" + Date.now().toString().slice(-6);

    const { error: studentError } = existingStudent
      ? { error: null }
      : await supabase.from("students").insert({
          user_id: data.user.id,
          student_id_number: studentIdNumber,
          class: "Unassigned",
          section: "A",
        });

    if (studentError) {
      // Rollback users row
      await supabase
        .from("users")
        .delete()
        .eq("id", data.user.id);

      await supabase.auth.signOut();

      throw new Error(
        "Failed to create student record: " +
          studentError.message,
      );
    }
  }

  const user: AuthUser = {
    id: data.user.id,
    role: input.role,
    name: trimmedName,
    initials: makeInitials(trimmedName),
    email: trimmedEmail,
  };

  localStorage.setItem(KEY, JSON.stringify(user));

  cachedRaw = JSON.stringify(user);
  cachedUser = user;

  void insertLog({
    user_id: data.user.id,
    action: "New account registered",
    status: "Success",
  }).catch(() => null);

  emit();

  return user;
}

// ─────────────────────────────────────────────────────────────
// REFRESH USER
// ─────────────────────────────────────────────────────────────
export async function refreshCurrentUser() {
  const current = read();

  if (!current) return;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", current.id)
    .single();

  if (error || !data) return;

  const updated: AuthUser = {
    id: current.id,
    role: data.role,
    name: data.name,
    email: data.email,
    initials: makeInitials(data.name),
  };

  localStorage.setItem(KEY, JSON.stringify(updated));

  cachedRaw = JSON.stringify(updated);
  cachedUser = updated;

  emit();
}

// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────
export async function logout() {
  await supabase.auth.signOut();

  localStorage.removeItem(KEY);

  cachedRaw = null;
  cachedUser = null;

  emit();
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────
export function useAuth(): AuthUser | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);

      return () => listeners.delete(cb);
    },
    read,
    () => null,
  );
}
