"use client";

import { useState } from "react";
import Link from "next/link";
import { FaBars, FaTimes, FaSearch } from "react-icons/fa";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-700 rounded-md flex items-center justify-center text-white font-bold">
                M
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-blue-900 dark:text-white leading-tight">
                  MSL <span className="text-red-600">Partner</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Database
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin-ui"
              className="hidden sm:inline-flex items-center px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition"
            >
              Add New Firm
            </Link>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
            >
              {open ? <FaTimes size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="px-4 pt-4 pb-6 space-y-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/admin-ui"
              className="block px-3 py-2 rounded-md text-base font-medium text-red-700 bg-red-50 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              Add New Firm
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
