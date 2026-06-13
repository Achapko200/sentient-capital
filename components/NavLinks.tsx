"use client";

// ─── NavLinks.tsx ─────────────────────────────────────────────────────────────

import Link        from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",            label: "Dashboard" },
  { href: "/agents",      label: "Agents" },
  { href: "/portfolio",   label: "Portfolio" },
  { href: "/identity",    label: "Identity" },
  { href: "/attestation", label: "Attestation" },
  { href: "/settings",    label: "Settings" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block rounded-lg px-3 py-2 text-sm transition ${
            pathname === link.href
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
