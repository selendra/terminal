"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Users,
  Coins,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Mail,
  Twitter,
  ExternalLink,
  Copy,
  Award,
  History,
  Activity,
  BarChart3,
  Zap,
  Star,
  Percent,
  Server,
  Calendar,
} from "lucide-react";
import toast from "react-hot-toast";

interface ValidatorDetailViewProps {
  validatorAddress: string;
}

interface Nominator {
  address: string;
  stake: string;
  share: number;
}

interface EraReward {
  era: number;
  reward: string;
  stake: string;
  points: number;
}

interface SlashEvent {
  era: number;
  amount: string;
  reason: string;
  date: Date;
}

// Mock validator data
const mockValidator = {
  address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  name: "Selendra Foundation",
  identity: {
    display: "Selendra Foundation",
    email: "validators@selendra.org",
    twitter: "@selendra",
    website: "https://selendra.org",
    legal: "Selendra Foundation Ltd.",
    riot: "@selendra:matrix.org",
  },
  totalStake: "5,500,000",
  ownStake: "1,000,000",
  nominators: 256,
  commission: 3,
  blocksProduced: 15420,
  eraPoints: 2450,
  status: "active" as const,
  isOversubscribed: false,
  apy: 14.5,
  slashes: 0,
  uptime: 99.98,
  avgBlockTime: "6.02s",
  lastPayout: new Date(Date.now() - 12 * 60 * 60 * 1000),
  nextPayout: new Date(Date.now() + 12 * 60 * 60 * 1000),
  activeEras: 234,
  rank: 1,
  rewardDestination: "Staked",
  controller: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty",
  sessionKeys: "0xabc123...",
};

const mockNominators: Nominator[] = [
  { address: "5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty", stake: "250,000", share: 4.55 },
  { address: "5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy", stake: "180,000", share: 3.27 },
  { address: "5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw", stake: "150,000", share: 2.73 },
  { address: "5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL", stake: "125,000", share: 2.27 },
  { address: "5Ew3MyB15VprZrjQVkpQFj8okmc9xLDSEdNhqMMS5cXsqxoW", stake: "100,000", share: 1.82 },
  { address: "5CXFinqBcs3Xo5uFv5THH7X2a6xdmqXp8RdPqDGPLT5RZDFL", stake: "95,000", share: 1.73 },
  { address: "5GNJqTPyNqANBkUVMN1LPPrxXnFouWXoe2wNSmmEoLctxiZY", stake: "85,000", share: 1.55 },
  { address: "5HpG9w8EBLe5XCrbczpwq5TSXvedjrBGCwqxK1iQ7qUsSWFc", stake: "75,000", share: 1.36 },
];

const mockEraRewards: EraReward[] = [
  { era: 234, reward: "12,450", stake: "5,500,000", points: 2450 },
  { era: 233, reward: "11,890", stake: "5,480,000", points: 2380 },
  { era: 232, reward: "12,100", stake: "5,420,000", points: 2410 },
  { era: 231, reward: "11,750", stake: "5,350,000", points: 2320 },
  { era: 230, reward: "12,200", stake: "5,300,000", points: 2440 },
  { era: 229, reward: "11,950", stake: "5,250,000", points: 2360 },
  { era: 228, reward: "12,050", stake: "5,200,000", points: 2400 },
];

const mockSlashes: SlashEvent[] = []; // No slashes for this validator

export function ValidatorDetailView({ validatorAddress }: ValidatorDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "nominators" | "rewards" | "slashes">("overview");
  const [isNominating, setIsNominating] = useState(false);

  const validator = mockValidator;
  const nominators = mockNominators;
  const eraRewards = mockEraRewards;
  const slashes = mockSlashes;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(validator.address);
    toast.success("Address copied to clipboard");
  };

  const handleNominate = () => {
    setIsNominating(true);
    setTimeout(() => {
      setIsNominating(false);
      toast.success("Nomination submitted! Waiting for confirmation...");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/validators")}
        className="flex items-center gap-2 text-foreground-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Validators
      </button>

      {/* Header */}
      <div className="bg-background-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-selendra-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {validator.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {validator.name || validator.address.slice(0, 16) + "..."}
                </h1>
                <span
                  className={clsx(
                    "px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1",
                    validator.status === "active"
                      ? "bg-green-500/20 text-green-500"
                      : validator.status === "waiting"
                      ? "bg-yellow-500/20 text-yellow-500"
                      : "bg-gray-500/20 text-foreground-secondary"
                  )}
                >
                  {validator.status === "active" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : validator.status === "waiting" ? (
                    <Clock className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}
                  {validator.status.charAt(0).toUpperCase() + validator.status.slice(1)}
                </span>
                <span className="px-2 py-1 bg-selendra-500/20 text-selendra-500 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Rank #{validator.rank}
                </span>
              </div>
              <div className="flex items-center gap-2 text-foreground-secondary">
                <span className="font-mono text-sm">{validator.address}</span>
                <button
                  onClick={handleCopyAddress}
                  className="p-1 hover:text-foreground transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {validator.identity && (
                <div className="flex items-center gap-4 mt-3">
                  {validator.identity.website && (
                    <a
                      href={validator.identity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-selendra-500 hover:text-selendra-600"
                    >
                      <Globe className="w-4 h-4" />
                      Website
                    </a>
                  )}
                  {validator.identity.email && (
                    <a
                      href={`mailto:${validator.identity.email}`}
                      className="flex items-center gap-1 text-sm text-selendra-500 hover:text-selendra-600"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  )}
                  {validator.identity.twitter && (
                    <a
                      href={`https://twitter.com/${validator.identity.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-selendra-500 hover:text-selendra-600"
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleNominate}
            disabled={isNominating}
            className="px-6 py-3 bg-selendra-500 hover:bg-selendra-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Shield className="w-5 h-5" />
            {isNominating ? "Nominating..." : "Nominate"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Coins className="w-4 h-4" />
            <span className="text-sm">Total Stake</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {validator.totalStake} SEL
          </p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Shield className="w-4 h-4" />
            <span className="text-sm">Own Stake</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {validator.ownStake} SEL
          </p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Nominators</span>
          </div>
          <p className="text-lg font-bold text-foreground">
            {validator.nominators}
          </p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Percent className="w-4 h-4" />
            <span className="text-sm">Commission</span>
          </div>
          <p className="text-lg font-bold text-green-500">{validator.commission}%</p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">APY</span>
          </div>
          <p className="text-lg font-bold text-green-500">{validator.apy}%</p>
        </div>
        <div className="bg-background-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-foreground-secondary mb-1">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Uptime</span>
          </div>
          <p className="text-lg font-bold text-green-500">{validator.uptime}%</p>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="font-semibold text-foreground">
              Block Production
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground-secondary">Blocks Produced</p>
              <p className="text-xl font-bold text-foreground">
                {validator.blocksProduced.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Era Points</p>
              <p className="text-xl font-bold text-foreground">
                {validator.eraPoints.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-500/10 rounded-xl border border-blue-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-semibold text-foreground">Payout Schedule</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground-secondary">Last Payout</p>
              <p className="text-sm font-medium text-foreground">
                {validator.lastPayout.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Next Payout</p>
              <p className="text-sm font-medium text-foreground">
                {validator.nextPayout.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-500/10 rounded-xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-semibold text-foreground">Experience</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-foreground-secondary">Active Eras</p>
              <p className="text-xl font-bold text-foreground">
                {validator.activeEras}
              </p>
            </div>
            <div>
              <p className="text-sm text-foreground-secondary">Avg Block Time</p>
              <p className="text-xl font-bold text-foreground">
                {validator.avgBlockTime}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-6">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "nominators", label: "Nominators", icon: Users },
            { id: "rewards", label: "Rewards History", icon: Award },
            { id: "slashes", label: "Slashes", icon: AlertTriangle },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                "flex items-center gap-2 py-3 border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-selendra-500 text-selendra-500"
                  : "border-transparent text-foreground-secondary hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === "nominators" && (
                <span className="px-2 py-0.5 bg-background-secondary rounded-full text-xs">
                  {nominators.length}
                </span>
              )}
              {tab.id === "slashes" && slashes.length > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full text-xs">
                  {slashes.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-background-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Validator Details
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-foreground-secondary">Controller</span>
                <Link
                  href={`/address/${validator.controller}`}
                  className="font-mono text-sm text-selendra-500 hover:text-selendra-600"
                >
                  {validator.controller.slice(0, 10)}...{validator.controller.slice(-8)}
                </Link>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-foreground-secondary">Reward Destination</span>
                <span className="font-medium text-foreground">
                  {validator.rewardDestination}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-foreground-secondary">Session Keys</span>
                <span className="font-mono text-sm text-foreground">
                  {validator.sessionKeys}
                </span>
              </div>
              {validator.identity?.legal && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-foreground-secondary">Legal Entity</span>
                  <span className="font-medium text-foreground">
                    {validator.identity.legal}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-background-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Stake Distribution
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground-secondary">Own Stake</span>
                  <span className="font-medium text-foreground">
                    {validator.ownStake} SEL (
                    {((parseFloat(validator.ownStake.replace(/,/g, "")) /
                      parseFloat(validator.totalStake.replace(/,/g, ""))) *
                      100).toFixed(1)}
                    %)
                  </span>
                </div>
                <div className="h-3 bg-background-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-selendra-500"
                    style={{
                      width: `${
                        (parseFloat(validator.ownStake.replace(/,/g, "")) /
                          parseFloat(validator.totalStake.replace(/,/g, ""))) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-foreground-secondary">Nominated Stake</span>
                  <span className="font-medium text-foreground">
                    {(
                      parseFloat(validator.totalStake.replace(/,/g, "")) -
                      parseFloat(validator.ownStake.replace(/,/g, ""))
                    ).toLocaleString()}{" "}
                    SEL
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "nominators" && (
        <div className="bg-background-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Nominator
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Stake
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Share
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {nominators.map((nominator, idx) => (
                  <tr key={idx} className="hover:bg-background-hover">
                    <td className="py-3 px-4 text-foreground-secondary">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/address/${nominator.address}`}
                        className="font-mono text-sm text-selendra-500 hover:text-selendra-600"
                      >
                        {nominator.address.slice(0, 10)}...{nominator.address.slice(-8)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">
                      {nominator.stake} SEL
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      {nominator.share}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "rewards" && (
        <div className="bg-background-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Era
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Reward
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Stake
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {eraRewards.map((era) => (
                  <tr key={era.era} className="hover:bg-background-hover">
                    <td className="py-3 px-4 text-selendra-500 font-medium">#{era.era}</td>
                    <td className="py-3 px-4 text-green-500 font-medium">
                      +{era.reward} SEL
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {era.stake} SEL
                    </td>
                    <td className="py-3 px-4 text-foreground-secondary">
                      {era.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "slashes" && (
        <div className="bg-background-card rounded-xl border border-border p-6">
          {slashes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Slashing Events
              </h3>
              <p className="text-foreground-secondary">
                This validator has a clean record with no slashing history.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                      Era
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                      Reason
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {slashes.map((slash, idx) => (
                    <tr key={idx} className="hover:bg-background-hover">
                      <td className="py-3 px-4 text-foreground">#{slash.era}</td>
                      <td className="py-3 px-4 text-red-500 font-medium">-{slash.amount}</td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        {slash.reason}
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        {slash.date.toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
