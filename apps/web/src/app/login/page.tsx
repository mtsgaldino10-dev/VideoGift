import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-foreground">VideoGift</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Entre para gerenciar seus vídeos.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
