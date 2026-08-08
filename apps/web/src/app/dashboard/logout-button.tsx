"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      title="Sair"
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      <LogOut size={15} strokeWidth={2} />
      <span className="hidden sm:inline">Sair</span>
    </button>
  );
}
