"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={
        "px-3 py-2 rounded-md text-base font-medium transition-colors " +
        (isActive
          ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-black"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800")
      }
      prefetch={false}
    >
      {children}
    </Link>
  );
} 