"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signIn } from "@/app/admin/auth-actions";
import Field from "@/components/ui/Field";
import { INITIAL_LOGIN, type LoginState } from "@/lib/action-state";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 w-full bg-champagne px-6 py-3 font-body text-[11px] uppercase tracking-[0.25em] text-obsidian transition-colors hover:bg-champagne-light disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState<LoginState, FormData>(
    signIn,
    INITIAL_LOGIN,
  );

  return (
    <form action={action} className="mt-10">
      <input type="hidden" name="next" value={next} />

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="username"
        required
      />

      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mt-6"
      />

      {state.status === "error" && (
        <p
          role="alert"
          className="mt-4 border-l-2 border-red-400/60 bg-red-400/5 px-3 py-2 font-body text-xs text-red-300/90"
        >
          {state.message}
        </p>
      )}

      <Submit />
    </form>
  );
}