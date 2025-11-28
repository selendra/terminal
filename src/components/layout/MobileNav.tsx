"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  X,
  LayoutDashboard,
  Blocks,
  FileText,
  Users,
  Coins,
  Vote,
  Wallet,
  ArrowLeftRight,
  Settings,
  Layers,
  Activity,
  Shield,
  Landmark,
  Zap,
  Code,
  BarChart3,
  Diamond,
  Fuel,
  TrendingUp,
  BookOpen,
} from "lucide-react";
import { clsx } from "clsx";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navigation: NavGroup[] = [
  {
    title: "Explorer",
    items: [
      {
        name: "Dashboard",
        href: "/",
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
      {
        name: "Blocks",
        href: "/blocks",
        icon: <Blocks className="h-5 w-5" />,
      },
      {
        name: "Transactions",
        href: "/transactions",
        icon: <FileText className="h-5 w-5" />,
      },
      {
        name: "Accounts",
        href: "/accounts",
        icon: <Users className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Assets",
    items: [
      {
        name: "Tokens",
        href: "/tokens",
        icon: <Coins className="h-5 w-5" />,
      },
      {
        name: "NFTs",
        href: "/tokens?tab=erc721",
        icon: <Diamond className="h-5 w-5" />,
      },
      {
        name: "Contracts",
        href: "/contracts",
        icon: <Layers className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Network",
    items: [
      {
        name: "Validators",
        href: "/validators",
        icon: <Shield className="h-5 w-5" />,
      },
      {
        name: "Staking",
        href: "/staking",
        icon: <Landmark className="h-5 w-5" />,
      },
      {
        name: "Governance",
        href: "/governance",
        icon: <Vote className="h-5 w-5" />,
      },
      {
        name: "Treasury",
        href: "/treasury",
        icon: <Wallet className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        name: "Gas Tracker",
        href: "/gas",
        icon: <Fuel className="h-5 w-5" />,
      },
      {
        name: "Charts",
        href: "/charts",
        icon: <BarChart3 className="h-5 w-5" />,
        badge: "New",
      },
      {
        name: "Top Stats",
        href: "/stats",
        icon: <TrendingUp className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "DeFi",
    items: [
      {
        name: "Bridge",
        href: "/bridge",
        icon: <ArrowLeftRight className="h-5 w-5" />,
        badge: "New",
      },
      {
        name: "DeFi Dashboard",
        href: "/defi",
        icon: <Activity className="h-5 w-5" />,
      },
    ],
  },
  {
    title: "Developers",
    items: [
      {
        name: "Developer Portal",
        href: "/developers",
        icon: <Code className="h-5 w-5" />,
        badge: "New",
      },
      {
        name: "API Docs",
        href: "/api-docs",
        icon: <BookOpen className="h-5 w-5" />,
      },
      {
        name: "Contract Verify",
        href: "/contracts/verify",
        icon: <Shield className="h-5 w-5" />,
      },
    ],
  },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Slide-in menu */}
      <div className="fixed inset-y-0 left-0 w-72 bg-background-secondary border-r border-border z-50 md:hidden animate-slide-in-left">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <Image
              src="https://selendra.org/selendra-logo.png"
              alt="Selendra Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-bold text-foreground">Selendra</span>
              <span className="text-xs text-foreground-secondary">Terminal</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-hover transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navigation.map((group) => (
            <div key={group.title} className="mb-6">
              <h3 className="px-4 mb-2 text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={clsx("nav-item", isActive && "active")}
                        onClick={onClose}
                      >
                        {item.icon}
                        <span className="flex-1">{item.name}</span>
                        {item.badge && (
                          <span className="badge badge-info text-[10px]">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Settings */}
        <div className="border-t border-border p-2">
          <Link
            href="/settings"
            className={clsx(
              "nav-item",
              pathname === "/settings" && "active"
            )}
            onClick={onClose}
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </div>
    </>
  );
}
