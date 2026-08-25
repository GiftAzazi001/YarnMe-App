"use client";

import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import { History, MessageSquare, Settings } from "lucide-react";
import { Link, usePathname } from "@/lib/navigation";
import { appCopy } from "@/lib/app-copy";
import { useYarnSettings } from "@/lib/settings";

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
  const { settings: yarnSettings } = useYarnSettings();
  const navCopy = appCopy[yarnSettings.language].navigation;
  const shellBackground = className ? className : "bg-background";
  const activeSection = pathname.startsWith("/history")
    ? "history"
    : pathname.startsWith("/settings")
      ? "settings"
      : "yarn";

  return (
    <div className={`min-h-dvh pb-[96px] md:pb-0 ${shellBackground}`}>
      {header !== "none" ? (
        <header className="sticky top-0 z-40 w-full bg-surface-container-lowest/92 backdrop-blur">
          <div className="mx-auto flex h-[66px] w-full max-w-[1180px] items-center justify-start px-container-margin md:h-[76px] md:justify-between md:px-lg">
            <Link
              href="/"
              aria-label={navCopy.homeAria}
              className="touch-target inline-flex items-center justify-start text-primary"
            >
              <Logo compact={header === "compact"} />
            </Link>

            <nav
              aria-label="Primary"
              className="hidden items-center gap-md text-label-lg font-bold md:flex lg:gap-xl"
            >
              {[
                { href: "/", label: navCopy.yarn, icon: MessageSquare, section: "yarn" },
                { href: "/history", label: navCopy.history, icon: History, section: "history" },
                { href: "/settings", label: navCopy.settings, icon: Settings, section: "settings" },
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
                    <Icon aria-hidden="true" size={24} strokeWidth={2.4} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
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
