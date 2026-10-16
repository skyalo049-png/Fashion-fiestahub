"use server";

import { redirect } from "next/navigation";

import { type LoginState } from "@/lib/action-state";
import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * Email + password sign-in.
 *
 * Password rather than a magic link because a magic link needs SMTP configured
 * on the hosted project before anyone can log in at all — and until it is,
 * "check your email" is a dead end with no error to show. A password works the
 * moment the user exists.
 *
 * The failure message is deliberately identical for a wrong password and an
 * unknown email. Telling them apart hands an attacker a user-enumeration
 * oracle for free.
 */
export async function signIn(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { status: "error", message: "Enter your email and password." };
  }

  const supabase = await createSessionSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: "That email and password do not match." };
  }

  // Only ever bounce to a path on this site. An open redirect here is a
  // phishing link that starts life on the real login page.
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createSessionSupabase();
  await supabase.auth.signOut();
  redirect("/admin/login");
}