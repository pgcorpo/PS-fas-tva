"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { clearTokenCache } from "@/lib/apiClient";

const navItems = [
  { href: "/daily", label: "today" },
  { href: "/habits", label: "habits" },
  { href: "/goals", label: "goals" },
  { href: "/progress", label: "stats" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-20">
            <div className="flex items-center gap-12">
              {/* Logo */}
              <Link href="/daily" className="flex-shrink-0 flex items-center group">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-105 transition-transform duration-200">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-gray-900">habits</span>
              </Link>

              {/* Navigation */}
              <div className="hidden md:flex items-center gap-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-pink-50 text-pink-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              {session?.user && (
                <>
                  <span className="hidden sm:block text-sm text-gray-600">
                    {session.user.email}
                  </span>
                  <button
                    onClick={() => {
                      clearTokenCache();
                      signOut({ callbackUrl: "/" });
                    }}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    peace out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 gap-1 py-2"
              >
                {/* Icon */}
                <div className={`transition-colors duration-200 ${
                  isActive ? "text-pink-600" : "text-gray-500"
                }`}>
                  {item.href === "/daily" && (
                    // Calendar with dot icon
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="9" y1="4" x2="9" y2="9" />
                      <line x1="15" y1="4" x2="15" y2="9" />
                      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
                    </svg>
                  )}
                  {item.href === "/habits" && (
                    // Stacked lines with checkmarks icon
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <line x1="6" y1="8" x2="10" y2="8" />
                      <polyline points="11 8 12 9 14 7" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="6" y1="12" x2="10" y2="12" />
                      <polyline points="11 12 12 13 14 11" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="6" y1="16" x2="10" y2="16" />
                      <polyline points="11 16 12 17 14 15" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {item.href === "/goals" && (
                    // Flag on mountain icon
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="M4 21 L4 10 L9 12 L9 19" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9 12 L14 14 L19 10 L14 8 L9 10" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="4" y1="21" x2="20" y2="21" strokeLinecap="round" />
                    </svg>
                  )}
                  {item.href === "/progress" && (
                    // Rising trend line icon
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <circle cx="5" cy="17" r="1.5" fill="currentColor" />
                      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
                      <circle cx="15" cy="9" r="1.5" fill="currentColor" />
                      <circle cx="20" cy="6" r="1.5" fill="currentColor" />
                      <path d="M5 17 L10 14 L15 9 L20 6" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <span className={`text-xs font-medium transition-colors duration-200 ${
                  isActive ? "text-pink-600" : "text-gray-500"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
