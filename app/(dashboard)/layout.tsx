import { requireActiveProfile } from "@/lib/auth/guards";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireActiveProfile();

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-zinc-950">
      <Sidebar profile={profile} />
      <main className="min-h-screen px-3 pb-24 pt-20 md:ml-72 md:px-0 md:pb-0 md:pt-0">
        {children}
      </main>
    </div>
  );
}
