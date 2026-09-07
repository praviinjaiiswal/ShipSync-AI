"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ArrowDownToLine, FileText, ShieldCheck, Settings, Ship, X, Radio } from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shipments", label: "Export Shipments", icon: Package },
  { href: "/imports", label: "Imports", icon: ArrowDownToLine },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/settings/customs", label: "Customs EDI", icon: Radio },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-card transform transition-transform duration-200 md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold text-base text-foreground">ShipSync AI</span>
          </Link>
          <button
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-orange/10 text-brand-orange"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}