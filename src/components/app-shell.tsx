"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import { FileText, History, MessageSquare, Settings } from "lucide-react";
import { Link, usePathname } from "@/lib/navigation";

type AppShellProps = {
  children: ReactNode;
  header?: "brand" | "compact" | "none";
  className?: string;
  mainClassName?: string;
};

export function AppShell({
  children,
  header = "brand",
  className = "",
  mainClassName = "",
}: AppShellProps) {
  const pathname = usePathname();
  const shellBackground = className ? className : "bg-background";
  const activeSection = pathname.startsWith("/history")
    ? "history"
    : pathname.startsWith("/settings")
      ? "settings"
      : "yarn";

  return (
    <div className={`min-h-dvh pb-[112px] lg:pb-0 ${shellBackground}`}>
      {header !== "none" ? (
        <header className="sticky top-0 z-40 w-full bg-surface-container-lowest/92 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-container-margin py-sm lg:h-[72px] lg:px-lg">
            <div className="hidden lg:block">
              <Link
                href="/"
                aria-label="YarnMe home"
                className="inline-flex items-center"
              >
                <Logo compact={header === "compact"} />
              </Link>
            </div>

            <Link
              href="/"
              aria-label="YarnMe home"
              className="touch-target flex items-center justify-start text-primary lg:hidden"
            >
              <Logo />
            </Link>

            <nav
              aria-label="Primary"
              className="hidden items-center gap-xl text-label-lg font-bold lg:flex"
            >
              {[
                { href: "/", label: "Yarn", icon: MessageSquare, section: "yarn" },
                { href: "/history", label: "History", icon: History, section: "history" },
                { href: "/settings", label: "Settings", icon: Settings, section: "settings" },
              ].map((item) => {
                const Icon = item.icon;
                const active = item.section === activeSection;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "inline-flex items-center gap-xs rounded-full px-sm py-xs transition",
                      active
                        ? "text-primary"
                        : "text-on-surface-variant hover:text-primary",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon aria-hidden="true" size={28} strokeWidth={2.4} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/history"
              aria-label="History"
              className="touch-target flex items-center justify-end text-primary"
            >
              <FileText aria-hidden="true" size={32} strokeWidth={2.4} />
            </Link>
          </div>
        </header>
      ) : null}

      <main className={`mx-auto w-full max-w-[720px] px-container-margin ${mainClassName}`}>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
