import { SiteHeader } from "@/components/layout/site-header";
import { RequireAuth } from "@/components/layout/require-auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">
        <RequireAuth>{children}</RequireAuth>
      </div>
    </div>
  );
}
