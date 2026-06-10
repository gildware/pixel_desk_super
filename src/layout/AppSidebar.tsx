"use client";

import React, { useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/src/context/SidebarContext";
import { useBranding } from "@/src/context/BrandingContext";
import {
  GridIcon,
  TableIcon,
  UserIcon,
  TimeIcon,
  FileIcon,
  ListIcon,
  BellIcon,
  MailIcon,
  DocsIcon,
  BoxCubeIcon,
} from "@/src/icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Dashboard", path: "/dashboard" },
  { icon: <TableIcon />, name: "Companies", path: "/companies" },
  { icon: <BellIcon />, name: "Notifications", path: "/notifications" },
  { icon: <MailIcon />, name: "Helpdesk", path: "/helpdesk" },
  { icon: <UserIcon />, name: "Users", path: "/users" },
  { icon: <ListIcon />, name: "Company defaults", path: "/settings/company-defaults" },
  { icon: <ListIcon />, name: "Platform catalog", path: "/settings/platform-catalog" },
  { icon: <DocsIcon />, name: "HelpDesk FAQs", path: "/settings/faqs" },
  { icon: <TimeIcon />, name: "Settings", path: "/settings" },
  { icon: <BoxCubeIcon />, name: "Website settings", path: "/settings/website" },
  { icon: <MailIcon />, name: "Email configurations", path: "/settings/email-configurations" },
  { icon: <FileIcon />, name: "Orphan data", path: "/orphan-data" },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { branding } = useBranding();
  const pathname = usePathname();
  const isActive = useCallback(
    (path: string) =>
      path === "/settings"
        ? pathname === "/settings"
        : pathname === path || pathname.startsWith(`${path}/`),
    [pathname],
  );

  const expanded = isExpanded || isHovered || isMobileOpen;
  const lightLogo = branding.logoUrl;
  const darkLogo = branding.logoDarkUrl || branding.logoUrl;
  const hasLogo = Boolean(lightLogo);

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
        isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/dashboard" className="flex items-center">
          {hasLogo ? (
            expanded ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="block max-h-10 w-auto object-contain dark:hidden"
                  src={lightLogo as string}
                  alt={branding.siteName}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="hidden max-h-10 w-auto object-contain dark:block"
                  src={darkLogo as string}
                  alt={branding.siteName}
                />
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-8 w-8 object-contain"
                src={lightLogo as string}
                alt={branding.siteName}
              />
            )
          ) : (
            <span
              className={`font-semibold text-gray-800 dark:text-white ${
                expanded ? "text-xl" : "text-lg"
              }`}
            >
              {expanded ? branding.siteName : branding.siteName.charAt(0)}
            </span>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <ul className="flex flex-col gap-4">
            {navItems.map((nav) => (
              <li key={nav.name}>
                <Link
                  href={nav.path}
                  className={`menu-item group ${
                    isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
                >
                  <span
                    className={
                      isActive(nav.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
