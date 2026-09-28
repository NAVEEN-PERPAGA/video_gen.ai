import Image from "next/image";
import googleLogo from "@/assets/icons/google.svg";
import { signInWithGoogle } from "@/app/auth/actions";

/** Header button for signed-out visitors: straight to Google, then back to `next` (the dashboard by default). */
export function GoogleSignInButton({ next = "/" }: { next?: string }) {
  return (
    <form action={signInWithGoogle} className="shrink-0">
      <input type="hidden" name="next" value={next} />
      <button
        type="submit"
        className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-black/10 bg-white px-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-black/25 hover:shadow dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-white/30"
      >
        <Image src={googleLogo} alt="" className="size-4" />
        Sign in with Google
      </button>
    </form>
  );
}
