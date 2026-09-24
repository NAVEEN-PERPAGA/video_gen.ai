import { LoginForm } from "./login-form";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold">Sign in to video_gen.ai</h1>
        <LoginForm
          next={typeof next === "string" ? next : undefined}
          initialError={error ? "Sign-in failed or the link expired. Please try again." : undefined}
        />
      </div>
    </main>
  );
}
