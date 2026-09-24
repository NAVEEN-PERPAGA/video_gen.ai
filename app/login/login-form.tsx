"use client";

import { useActionState, useState } from "react";
import { login, signInWithGoogle, signup } from "@/app/auth/actions";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [signupState, signupAction, signupPending] = useActionState(signup, undefined);

  const isLogin = mode === "login";
  const state = isLogin ? loginState : signupState;
  const pending = isLogin ? loginPending : signupPending;
  const error = state?.error ?? (isLogin ? initialError : undefined);

  return (
    <form action={isLogin ? loginAction : signupAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="rounded-md border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {state?.message && <p className="text-sm text-green-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
      </button>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
        or
        <span className="h-px flex-1 bg-black/10 dark:bg-white/15" />
      </div>

      {/* formAction overrides the form's action for this button only. */}
      <button
        type="submit"
        formAction={signInWithGoogle}
        formNoValidate
        className="rounded-md border border-black/15 px-4 py-2 font-medium dark:border-white/20"
      >
        Continue with Google
      </button>

      <button
        type="button"
        onClick={() => setMode(isLogin ? "signup" : "login")}
        className="text-sm text-zinc-600 underline dark:text-zinc-400"
      >
        {isLogin ? "No account? Sign up" : "Have an account? Sign in"}
      </button>
    </form>
  );
}
