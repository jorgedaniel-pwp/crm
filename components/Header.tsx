'use client';

import Link from "next/link";
import ThemeSwitch from "./ThemeSwitch";
import { LoginButton } from "@/components/auth/login-button";
import { Briefcase } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white dark:bg-black shadow-sm dark:border-b dark:border-gray-800">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-gray-800 dark:text-gray-100" />
          <span className="text-xl font-semibold text-gray-800 dark:text-gray-100">Sales Companion</span>
        </Link>
        <nav className="flex items-center gap-2">
          <LoginButton />
          <ThemeSwitch />
        </nav>
      </div>
    </header>
  );
}
