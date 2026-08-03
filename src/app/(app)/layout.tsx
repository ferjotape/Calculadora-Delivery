import type { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";

export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <AppSidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
