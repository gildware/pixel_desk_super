"use client";

import { useEffect } from "react";
import { useSidebar } from "@/src/context/SidebarContext";
import AppHeader from "@/src/layout/AppHeader";
import AppSidebar from "@/src/layout/AppSidebar";
import Backdrop from "@/src/layout/Backdrop";
import React from "react";

const REDIRECT_ATTEMPT_KEY = "auth-redirect-to-dashboard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  useEffect(() => {
    sessionStorage.removeItem(REDIRECT_ATTEMPT_KEY);
  }, []);

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen">
      <AppSidebar />
      <Backdrop />
      <div
        className={`flex min-h-[100dvh] flex-col overflow-x-hidden transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <div className="shrink-0">
          <AppHeader />
        </div>
        <main className="mx-auto flex min-h-0 w-full max-w-(--breakpoint-2xl) flex-1 flex-col p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
