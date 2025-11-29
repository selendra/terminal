"use client";

import { useState } from "react";
import {
  User,
  BadgeCheck,
  Mail,
  Globe,
  Twitter,
  AtSign,
  Shield,
  ShieldCheck,
  ShieldQuestion,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Github,
  MessageCircle,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useSNSProfile, useSNSLookup } from "@/lib/hooks/useSNS";
import type { SNSProfile, VerificationLevel } from "@/lib/sns";

// =============================================================================
// Types
// =============================================================================

export type { SNSProfile, VerificationLevel };

// Verification level config
const VERIFICATION_CONFIG: Record<
  VerificationLevel,
  { color: string; bgColor: string; icon: typeof BadgeCheck; label: string }
> = {
  none: {
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    icon: ShieldQuestion,
    label: "Unverified",
  },
  basic: {
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: Shield,
    label: "Basic",
  },
  verified: {
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: ShieldCheck,
    label: "Verified",
  },
  trusted: {
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    icon: BadgeCheck,
    label: "Trusted",
  },
};

// =============================================================================
// Identity Badge (Compact)
// =============================================================================

interface IdentityBadgeProps {
  profile: SNSProfile | null;
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
  showDomain?: boolean;
  className?: string;
}

export function IdentityBadge({
  profile,
  isLoading,
  size = "md",
  showDomain = true,
  className,
}: IdentityBadgeProps) {
  if (isLoading) {
    return (
      <span className={clsx("inline-flex items-center gap-1", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-foreground-secondary" />
      </span>
    );
  }

  if (!profile) {
    return null;
  }

  const verificationLevel = profile.verification?.level || "none";
  const config = VERIFICATION_CONFIG[verificationLevel];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs gap-1",
    md: "text-sm gap-1.5",
    lg: "text-base gap-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span className={clsx("inline-flex items-center", sizeClasses[size], className)}>
      {/* Avatar */}
      {profile.avatar && (
        <img
          src={profile.avatar}
          alt={profile.domain}
          className={clsx(
            "rounded-full",
            size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : "w-6 h-6"
          )}
        />
      )}
      
      {/* Domain name */}
      {showDomain && (
        <span className="font-medium text-foreground truncate max-w-[150px]">
          {profile.domain}
        </span>
      )}
      
      {/* Verification badge */}
      {verificationLevel !== "none" && (
        <span
          className={clsx(
            "inline-flex items-center justify-center rounded-full p-0.5",
            config.bgColor
          )}
          title={config.label}
        >
          <Icon className={clsx(iconSizes[size], config.color)} />
        </span>
      )}
    </span>
  );
}

// =============================================================================
// Main Identity Display
// =============================================================================

interface IdentityDisplayProps {
  // Either provide a domain directly or an address for reverse lookup
  domain?: string;
  address?: string;
  
  // Or provide profile data directly
  profile?: SNSProfile | null;
  isLoading?: boolean;
  
  // Display options
  showDetails?: boolean;
  onRegisterDomain?: () => void;
  className?: string;
}

export function IdentityDisplay({
  domain,
  address,
  profile: propProfile,
  isLoading: propLoading,
  showDetails = true,
  onRegisterDomain,
  className,
}: IdentityDisplayProps) {
  // Fetch profile based on domain or address
  const { profile: domainProfile, isLoading: domainLoading } = useSNSProfile(
    propProfile === undefined && domain ? domain : null
  );
  
  const { profile: lookupProfile, isLoading: lookupLoading, domain: reverseDomain } = useSNSLookup(
    propProfile === undefined && !domain && address ? address : null
  );

  const profile = propProfile ?? domainProfile ?? lookupProfile;
  const isLoading = propLoading ?? domainLoading ?? lookupLoading;

  const [expanded, setExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={clsx("bg-background-card border border-border rounded-xl p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-background-tertiary animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-background-tertiary rounded animate-pulse" />
            <div className="h-3 w-32 bg-background-tertiary rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <div className={clsx("bg-background-card border border-border rounded-xl p-6", className)}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-background-tertiary flex items-center justify-center">
            <User className="h-6 w-6 text-foreground-secondary" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No .sel Domain</h3>
          <p className="text-sm text-foreground-secondary mb-4">
            {address 
              ? "This address has not registered a .sel domain"
              : "Register a .sel domain to create your identity"
            }
          </p>
          {onRegisterDomain && (
            <button
              onClick={onRegisterDomain}
              className="px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg text-sm transition-colors"
            >
              Register Domain
            </button>
          )}
        </div>
      </div>
    );
  }

  const verificationLevel = profile.verification?.level || "none";
  const config = VERIFICATION_CONFIG[verificationLevel];
  const Icon = config.icon;

  return (
    <div className={clsx("bg-background-card border border-border rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.domain}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-selendra-500 to-selendra-700 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile.domain.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Verification Badge Overlay */}
            {verificationLevel !== "none" && (
              <div
                className={clsx(
                  "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background-card flex items-center justify-center",
                  config.bgColor
                )}
              >
                <Icon className={clsx("h-3.5 w-3.5", config.color)} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-lg text-foreground">
                {profile.domain}
              </h3>
              {verificationLevel !== "none" && (
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
                    config.bgColor,
                    config.color
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </span>
              )}
            </div>
            {profile.description && (
              <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                {profile.description}
              </p>
            )}
            {profile.evmAddress && (
              <p className="text-xs text-foreground-secondary font-mono mt-1">
                {profile.evmAddress.slice(0, 6)}...{profile.evmAddress.slice(-4)}
              </p>
            )}
          </div>

          {/* Expand/Collapse */}
          {showDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Social Links (always visible) */}
      {(profile.twitter || profile.github || profile.telegram || profile.discord) && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {profile.twitter && (
            <SocialLink
              icon={Twitter}
              href={`https://twitter.com/${profile.twitter}`}
              label={`@${profile.twitter}`}
            />
          )}
          {profile.github && (
            <SocialLink
              icon={Github}
              href={`https://github.com/${profile.github}`}
              label={profile.github}
            />
          )}
          {profile.telegram && (
            <SocialLink
              icon={MessageCircle}
              href={`https://t.me/${profile.telegram}`}
              label={profile.telegram}
            />
          )}
        </div>
      )}

      {/* Expanded Details */}
      {showDetails && expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          {/* Contact Info */}
          <div className="space-y-2">
            {profile.email && (
              <InfoRow
                icon={Mail}
                label="Email"
                value={profile.email}
                href={`mailto:${profile.email}`}
                onCopy={() => copyToClipboard(profile.email!, "email")}
                copied={copiedField === "email"}
              />
            )}
            {profile.url && (
              <InfoRow
                icon={Globe}
                label="Website"
                value={profile.url}
                href={profile.url}
                external
                onCopy={() => copyToClipboard(profile.url!, "url")}
                copied={copiedField === "url"}
              />
            )}
            {profile.evmAddress && (
              <InfoRow
                icon={AtSign}
                label="EVM Address"
                value={profile.evmAddress}
                onCopy={() => copyToClipboard(profile.evmAddress!, "evmAddress")}
                copied={copiedField === "evmAddress"}
              />
            )}
            {profile.substrateAddress && (
              <InfoRow
                icon={AtSign}
                label="Substrate Address"
                value={profile.substrateAddress}
                onCopy={() => copyToClipboard(profile.substrateAddress!, "substrateAddress")}
                copied={copiedField === "substrateAddress"}
              />
            )}
          </div>

          {/* Contenthash */}
          {profile.contenthash && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Content</h4>
              <a
                href={`https://ipfs.io/ipfs/${profile.contenthash.replace("ipfs://", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-selendra-400 hover:text-selendra-300 flex items-center gap-1"
              >
                View on IPFS
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {/* Expiry */}
          {profile.expiry && (
            <div className="text-xs text-foreground-secondary">
              Expires: {profile.expiry.toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Helper Components
// =============================================================================

interface SocialLinkProps {
  icon: typeof Twitter;
  href: string;
  label: string;
}

function SocialLink({ icon: Icon, href, label }: SocialLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background hover:bg-background-hover rounded-full text-xs text-foreground-secondary hover:text-foreground transition-colors"
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </a>
  );
}

interface InfoRowProps {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

function InfoRow({ icon: Icon, label, value, href, external, onCopy, copied }: InfoRowProps) {
  const content = (
    <div className="flex items-center gap-3 px-3 py-2 bg-background rounded-lg group">
      <Icon className="h-4 w-4 text-foreground-secondary flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground-secondary">{label}</p>
        <p className="text-sm text-foreground truncate font-mono">{value}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onCopy && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCopy();
            }}
            className="p-1 text-foreground-secondary hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
        {external && href && (
          <ExternalLink className="h-3.5 w-3.5 text-foreground-secondary" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="block hover:ring-1 hover:ring-selendra-500/50 rounded-lg transition-all"
      >
        {content}
      </a>
    );
  }

  return content;
}

// =============================================================================
// Inline Identity (for use in tables, lists)
// =============================================================================

interface IdentityInlineProps {
  domain?: string;
  address?: string;
  profile?: SNSProfile | null;
  isLoading?: boolean;
  showAvatar?: boolean;
  className?: string;
}

export function IdentityInline({
  domain,
  address,
  profile: propProfile,
  isLoading: propLoading,
  className,
}: IdentityInlineProps) {
  const { profile: domainProfile, isLoading: domainLoading } = useSNSProfile(
    propProfile === undefined && domain ? domain : null
  );
  
  const { profile: lookupProfile, isLoading: lookupLoading } = useSNSLookup(
    propProfile === undefined && !domain && address ? address : null
  );

  const profile = propProfile ?? domainProfile ?? lookupProfile;
  const isLoading = propLoading ?? domainLoading ?? lookupLoading;

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin text-foreground-secondary" />;
  }

  if (!profile) {
    return null;
  }

  return (
    <IdentityBadge
      profile={profile}
      size="sm"
      showDomain
      className={className}
    />
  );
}

// =============================================================================
// Domain Search/Registration CTA
// =============================================================================

interface DomainSearchProps {
  onSearch?: (domain: string) => void;
  onRegister?: (domain: string) => void;
  className?: string;
}

export function DomainSearch({ onSearch, className }: DomainSearchProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query);
    }
  };

  return (
    <div className={clsx("bg-background-card border border-border rounded-xl p-6", className)}>
      <h3 className="font-semibold text-lg text-foreground mb-2">
        Get Your .sel Domain
      </h3>
      <p className="text-sm text-foreground-secondary mb-4">
        Register a human-readable name for your Selendra address
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="yourname"
            className="w-full px-4 py-2.5 pr-12 bg-background border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500/50"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-secondary">
            .sel
          </span>
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg transition-colors"
        >
          Search
        </button>
      </form>
    </div>
  );
}
