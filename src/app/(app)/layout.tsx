import type { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
