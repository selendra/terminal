"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Copy,
  Check,
  Info,
  AlertCircle,
  ChevronRight,
  Star,
  StarOff,
  Shield,
  ShieldCheck,
  ShieldAlert,
  BarChart3,
  Percent,
  Coins,
  Clock,
  Activity,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { AddressDisplay, VMBadge } from "../common";
import { IdentityBadge } from "../common/IdentityDisplay";

export interface ValidatorInfo {
  address: string;
  controllerAddress?: string;
  name?: string;
  commission: number;
  totalStake: string;
  ownStake: string;
  nominators: number;
  nominatorCap?: number;
  isActive: boolean;
  isOversubscribed: boolean;
  isBlocked: boolean;
  isSlashed: boolean;
  apy: number;
  eraPoints: number;
  blocksProduced: number;
  rewardsLastEra?: string;
  identity?: {
    display?: string;
    verified: boolean;
  };
}

interface ValidatorListProps {
  validators?: ValidatorInfo[];
  selectedValidator?: string | null;
  onSelectValidator?: (address: string) => void;
  showActions?: boolean;
  maxNominations?: number;
}

export function ValidatorList({
  validators: propValidators,
  selectedValidator,
  onSelectValidator,
  showActions = true,
  maxNominations = 16,
}: ValidatorListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"stake" | "apy" | "commission" | "nominators">("stake");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [showOnlyVerified, setShowOnlyVerified] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedValidators, setSelectedValidators] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  // Mock validators if not provided
  const defaultValidators: ValidatorInfo[] = [
    {
      address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      name: "Selendra Foundation #1",
      commission: 5,
      totalStake: "15234567",
      ownStake: "5000000",
      nominators: 245,
      nominatorCap: 256,
      isActive: true,
      isOversubscribed: false,
      isBlocked: false,
      isSlashed: false,
      apy: 14.2,
      eraPoints: 2450,
      blocksProduced: 156,
      identity: { display: "Selendra Foundation #1", verified: true },
    },
    {
      address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
      name: "Selendra Foundation #2",
      commission: 3,
      totalStake: "12345678",
      ownStake: "4500000",
      nominators: 198,
      nominatorCap: 256,
      isActive: true,
      isOversubscribed: false,
      isBlocked: false,
      isSlashed: false,
      apy: 13.8,
      eraPoints: 2320,
      blocksProduced: 142,
      identity: { display: "Selendra Foundation #2", verified: true },
    },
    {
      address: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy",
      name: "Community Validator",
      commission: 10,
      totalStake: "8765432",
      ownStake: "2000000",
      nominators: 156,
      nominatorCap: 256,
      isActive: true,
      isOversubscribed: false,
      isBlocked: false,
      isSlashed: false,
      apy: 12.1,
      eraPoints: 1980,
      blocksProduced: 120,
      identity: { display: "Community Validator", verified: false },
    },
    {
      address: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw",
      name: "DeFi Stakers",
      commission: 8,
      totalStake: "6543210",
      ownStake: "1500000",
      nominators: 87,
      nominatorCap: 256,
      isActive: true,
      isOversubscribed: false,
      isBlocked: false,
      isSlashed: false,
      apy: 11.5,
      eraPoints: 1850,
      blocksProduced: 98,
    },
    {
      address: "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL",
      name: "Waiting Validator",
      commission: 5,
      totalStake: "1234567",
      ownStake: "500000",
      nominators: 45,
      nominatorCap: 256,
      isActive: false,
      isOversubscribed: false,
      isBlocked: false,
      isSlashed: false,
      apy: 0,
      eraPoints: 0,
      blocksProduced: 0,
    },
  ];

  const validators = propValidators || defaultValidators;

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("selendra_validator_favorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        console.error("Failed to parse favorites");
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem("selendra_validator_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (address: string) => {
    setFavorites((prev) =>
      prev.includes(address)
        ? prev.filter((a) => a !== address)
        : [...prev, address]
    );
  };

  const toggleSelection = (address: string) => {
    if (selectedValidators.includes(address)) {
      setSelectedValidators((prev) => prev.filter((a) => a !== address));
    } else if (selectedValidators.length < maxNominations) {
      setSelectedValidators((prev) => [...prev, address]);
    } else {
      toast.error(`Maximum ${maxNominations} validators can be selected`);
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(address);
      toast.success("Address copied!");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Filter and sort validators
  const filteredValidators = validators
    .filter((v) => {
      const matchesSearch =
        v.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.identity?.display?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesActive = filterActive === null || v.isActive === filterActive;
      const matchesVerified = !showOnlyVerified || v.identity?.verified;
      return matchesSearch && matchesActive && matchesVerified;
    })
    .sort((a, b) => {
      // Favorites first
      const aFav = favorites.includes(a.address) ? 1 : 0;
      const bFav = favorites.includes(b.address) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;

      // Then by sort criteria
      let comparison = 0;
      switch (sortBy) {
        case "stake":
          comparison = parseFloat(a.totalStake) - parseFloat(b.totalStake);
          break;
        case "apy":
          comparison = a.apy - b.apy;
          break;
        case "commission":
          comparison = a.commission - b.commission;
          break;
        case "nominators":
          comparison = a.nominators - b.nominators;
          break;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

  const formatStake = (stake: string) => {
    const num = parseFloat(stake);
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Users className="h-5 w-5 text-selendra-400" />
          Validators ({filteredValidators.length})
        </h2>
        {showActions && selectedValidators.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground-secondary">
              {selectedValidators.length}/{maxNominations} selected
            </span>
            <button
              onClick={() => setSelectedValidators([])}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Clear
            </button>
            <button className="px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg text-sm transition-colors">
              Nominate Selected
            </button>
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-secondary" />
          <input
            type="text"
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background-card border border-border rounded-lg text-foreground placeholder:text-foreground-secondary focus:outline-none focus:border-selendra-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterActive === null ? "all" : filterActive ? "active" : "waiting"}
            onChange={(e) => {
              const val = e.target.value;
              setFilterActive(val === "all" ? null : val === "active");
            }}
            className="px-3 py-2 bg-background-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-selendra-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="waiting">Waiting</option>
          </select>
          <button
            onClick={() => setShowOnlyVerified(!showOnlyVerified)}
            className={clsx(
              "flex items-center gap-1 px-3 py-2 rounded-lg border text-sm transition-colors",
              showOnlyVerified
                ? "border-green-500 bg-green-500/10 text-green-400"
                : "border-border text-foreground-secondary hover:text-foreground"
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Verified
          </button>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by as typeof sortBy);
              setSortOrder(order as typeof sortOrder);
            }}
            className="px-3 py-2 bg-background-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-selendra-500"
          >
            <option value="stake-desc">Stake (High → Low)</option>
            <option value="stake-asc">Stake (Low → High)</option>
            <option value="apy-desc">APY (High → Low)</option>
            <option value="apy-asc">APY (Low → High)</option>
            <option value="commission-asc">Commission (Low → High)</option>
            <option value="commission-desc">Commission (High → Low)</option>
            <option value="nominators-desc">Nominators (High → Low)</option>
          </select>
        </div>
      </div>

      {/* Validator List */}
      <div className="bg-background-card border border-border rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-background-tertiary border-b border-border text-sm text-foreground-secondary">
          <div className="col-span-5">Validator</div>
          <div className="col-span-2 text-right">Total Stake</div>
          <div className="col-span-1 text-right">APY</div>
          <div className="col-span-1 text-right">Commission</div>
          <div className="col-span-2 text-right">Nominators</div>
          <div className="col-span-1"></div>
        </div>

        {/* Validators */}
        <div className="divide-y divide-border">
          {filteredValidators.map((validator) => (
            <ValidatorRow
              key={validator.address}
              validator={validator}
              isFavorite={favorites.includes(validator.address)}
              isSelected={
                selectedValidator === validator.address ||
                selectedValidators.includes(validator.address)
              }
              onToggleFavorite={() => toggleFavorite(validator.address)}
              onSelect={() => {
                if (onSelectValidator) {
                  onSelectValidator(validator.address);
                } else {
                  toggleSelection(validator.address);
                }
              }}
              onCopy={() => copyAddress(validator.address)}
              copied={copied === validator.address}
              formatStake={formatStake}
              showCheckbox={showActions && !onSelectValidator}
            />
          ))}
        </div>

        {filteredValidators.length === 0 && (
          <div className="p-8 text-center text-foreground-secondary">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No validators found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Validator Row Component
interface ValidatorRowProps {
  validator: ValidatorInfo;
  isFavorite: boolean;
  isSelected: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
  onCopy: () => void;
  copied: boolean;
  formatStake: (stake: string) => string;
  showCheckbox: boolean;
}

function ValidatorRow({
  validator,
  isFavorite,
  isSelected,
  onToggleFavorite,
  onSelect,
  onCopy,
  copied,
  formatStake,
  showCheckbox,
}: ValidatorRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={clsx(
        "transition-colors",
        isSelected ? "bg-selendra-500/10" : "hover:bg-background-hover"
      )}
    >
      <div
        className="grid grid-cols-12 gap-4 px-4 py-3 items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Validator Info */}
        <div className="col-span-5 flex items-center gap-3">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-border text-selendra-500 focus:ring-selendra-500"
            />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="text-foreground-secondary hover:text-yellow-400"
          >
            {isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {validator.identity?.display || validator.name || "Unknown"}
              </span>
              {validator.identity?.verified && (
                <ShieldCheck className="h-4 w-4 text-green-400 flex-shrink-0" />
              )}
              {!validator.isActive && (
                <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                  Waiting
                </span>
              )}
              {validator.isOversubscribed && (
                <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
                  Oversubscribed
                </span>
              )}
              {validator.isSlashed && (
                <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                  Slashed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-foreground-secondary font-mono">
                {validator.address.slice(0, 8)}...{validator.address.slice(-6)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="text-foreground-secondary hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-400" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Total Stake */}
        <div className="col-span-2 text-right">
          <p className="font-medium text-foreground">
            {formatStake(validator.totalStake)} SEL
          </p>
          <p className="text-xs text-foreground-secondary">
            Own: {formatStake(validator.ownStake)}
          </p>
        </div>

        {/* APY */}
        <div className="col-span-1 text-right">
          <span
            className={clsx(
              "font-medium",
              validator.apy > 12
                ? "text-green-400"
                : validator.apy > 0
                ? "text-foreground"
                : "text-foreground-secondary"
            )}
          >
            {validator.apy > 0 ? `${validator.apy}%` : "-"}
          </span>
        </div>

        {/* Commission */}
        <div className="col-span-1 text-right">
          <span
            className={clsx(
              "font-medium",
              validator.commission <= 5
                ? "text-green-400"
                : validator.commission <= 10
                ? "text-yellow-400"
                : "text-red-400"
            )}
          >
            {validator.commission}%
          </span>
        </div>

        {/* Nominators */}
        <div className="col-span-2 text-right">
          <p className="font-medium text-foreground">{validator.nominators}</p>
          {validator.nominatorCap && (
            <p className="text-xs text-foreground-secondary">
              / {validator.nominatorCap} max
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="col-span-1 text-right">
          <ChevronRight
            className={clsx(
              "h-5 w-5 text-foreground-secondary inline-block transition-transform",
              expanded && "rotate-90"
            )}
          />
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4">
          <div className="ml-7 p-4 bg-background rounded-lg space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-foreground-secondary">Era Points</p>
                <p className="font-medium text-foreground">{validator.eraPoints}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Blocks Produced</p>
                <p className="font-medium text-foreground">{validator.blocksProduced}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Last Era Rewards</p>
                <p className="font-medium text-foreground">
                  {validator.rewardsLastEra || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs text-foreground-secondary">Status</p>
                <p
                  className={clsx(
                    "font-medium",
                    validator.isActive ? "text-green-400" : "text-yellow-400"
                  )}
                >
                  {validator.isActive ? "Active" : "Waiting"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="flex-1 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg text-sm transition-colors"
              >
                {isSelected ? "Deselect" : "Select for Nomination"}
              </button>
              <a
                href={`/validators/${validator.address}`}
                className="px-4 py-2 border border-border text-foreground hover:bg-background-hover rounded-lg text-sm transition-colors"
              >
                View Details
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Staking Operations Modal
interface StakingModalProps {
  type: "bond" | "unbond" | "rebond" | "withdraw";
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: string) => Promise<void>;
  maxAmount?: string;
  bondedAmount?: string;
  unbondingAmount?: string;
}

export function StakingModal({
  type,
  isOpen,
  onClose,
  onSubmit,
  maxAmount = "0",
  bondedAmount = "0",
  unbondingAmount = "0",
}: StakingModalProps) {
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = {
    bond: {
      title: "Bond SEL",
      description: "Bond your tokens to start staking",
      buttonText: "Bond",
      maxLabel: "Available",
    },
    unbond: {
      title: "Unbond SEL",
      description: "Unbond your tokens (28-day waiting period)",
      buttonText: "Unbond",
      maxLabel: "Bonded",
    },
    rebond: {
      title: "Rebond SEL",
      description: "Cancel unbonding and rebond your tokens",
      buttonText: "Rebond",
      maxLabel: "Unbonding",
    },
    withdraw: {
      title: "Withdraw SEL",
      description: "Withdraw your unbonded tokens",
      buttonText: "Withdraw",
      maxLabel: "Withdrawable",
    },
  };

  const currentConfig = config[type];
  const max =
    type === "unbond" ? bondedAmount : type === "rebond" ? unbondingAmount : maxAmount;

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(amount);
      onClose();
      setAmount("");
    } catch (error) {
      toast.error("Transaction failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {currentConfig.title}
        </h2>
        <p className="text-foreground-secondary text-sm mb-6">
          {currentConfig.description}
        </p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-foreground-secondary">Amount</label>
              <span className="text-sm text-foreground-secondary">
                {currentConfig.maxLabel}: {max} SEL
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground text-lg font-medium focus:outline-none focus:border-selendra-500"
              />
              <button
                onClick={() => setAmount(max)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-selendra-400 hover:text-selendra-300"
              >
                MAX
              </button>
            </div>
          </div>

          {type === "unbond" && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-400">
                  Unbonded tokens have a 28-day waiting period before they can be
                  withdrawn.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-border rounded-xl text-foreground hover:bg-background-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              className="flex-1 py-3 bg-selendra-600 hover:bg-selendra-700 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Processing..." : currentConfig.buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
