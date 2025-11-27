'use client';

import React, { useState } from 'react';
import {
  Users,
  Shield,
  TrendingUp,
  Search,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Globe,
  Clock,
  Coins,
  Award,
  ExternalLink,
  Copy,
  Star,
  StarOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Validator {
  id: string;
  address: string;
  name?: string;
  identity?: {
    display: string;
    email?: string;
    twitter?: string;
    website?: string;
  };
  totalStake: string;
  ownStake: string;
  nominators: number;
  commission: number;
  blocksProduced: number;
  eraPoints: number;
  status: 'active' | 'waiting' | 'inactive';
  isOversubscribed: boolean;
  apy: number;
  slashes: number;
}

interface ValidatorStats {
  totalValidators: number;
  activeValidators: number;
  waitingValidators: number;
  totalStaked: string;
  averageCommission: number;
  minStake: string;
}

const mockStats: ValidatorStats = {
  totalValidators: 150,
  activeValidators: 4,
  waitingValidators: 50,
  totalStaked: '125,000,000 SEL',
  averageCommission: 5,
  minStake: '10,000 SEL',
};

const mockValidators: Validator[] = [
  {
    id: '1',
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    name: 'Selendra Foundation',
    identity: {
      display: 'Selendra Foundation',
      email: 'validators@selendra.org',
      twitter: '@selendra',
      website: 'https://selendra.org',
    },
    totalStake: '5,500,000 SEL',
    ownStake: '1,000,000 SEL',
    nominators: 256,
    commission: 3,
    blocksProduced: 15420,
    eraPoints: 2450,
    status: 'active',
    isOversubscribed: false,
    apy: 14.5,
    slashes: 0,
  },
  {
    id: '2',
    address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty',
    name: 'Stake Capital',
    identity: {
      display: 'Stake Capital',
      website: 'https://stake.capital',
    },
    totalStake: '4,200,000 SEL',
    ownStake: '800,000 SEL',
    nominators: 189,
    commission: 5,
    blocksProduced: 12300,
    eraPoints: 2100,
    status: 'active',
    isOversubscribed: false,
    apy: 13.8,
    slashes: 0,
  },
  {
    id: '3',
    address: '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y',
    totalStake: '3,800,000 SEL',
    ownStake: '500,000 SEL',
    nominators: 312,
    commission: 2,
    blocksProduced: 11500,
    eraPoints: 1980,
    status: 'active',
    isOversubscribed: true,
    apy: 14.2,
    slashes: 0,
  },
  {
    id: '4',
    address: '5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy',
    name: 'Everstake',
    identity: {
      display: 'Everstake',
      email: 'support@everstake.one',
      twitter: '@evaborative',
      website: 'https://everstake.one',
    },
    totalStake: '3,500,000 SEL',
    ownStake: '600,000 SEL',
    nominators: 145,
    commission: 4,
    blocksProduced: 10800,
    eraPoints: 1850,
    status: 'active',
    isOversubscribed: false,
    apy: 13.5,
    slashes: 0,
  },
  {
    id: '5',
    address: '5HGjWAeFDfFCWPsjFQdVV2Msvz2XtMktvgocEZcCj68kUMaw',
    name: 'P2P Validator',
    identity: {
      display: 'P2P Validator',
      website: 'https://p2p.org',
    },
    totalStake: '2,900,000 SEL',
    ownStake: '400,000 SEL',
    nominators: 98,
    commission: 7,
    blocksProduced: 9500,
    eraPoints: 1620,
    status: 'active',
    isOversubscribed: false,
    apy: 12.8,
    slashes: 1,
  },
  {
    id: '6',
    address: '5CiPPseXPECbkjWCa6MnjNokrgYjMqmKndv2rSnekmSK2DjL',
    totalStake: '1,200,000 SEL',
    ownStake: '200,000 SEL',
    nominators: 45,
    commission: 10,
    blocksProduced: 0,
    eraPoints: 0,
    status: 'waiting',
    isOversubscribed: false,
    apy: 0,
    slashes: 0,
  },
  {
    id: '7',
    address: '5Ew3MyB15VprZrjQVkpQFj8okmc9xLDSEdNhqMMS5cXsqxoW',
    name: 'Node Guardians',
    totalStake: '950,000 SEL',
    ownStake: '150,000 SEL',
    nominators: 32,
    commission: 8,
    blocksProduced: 0,
    eraPoints: 0,
    status: 'waiting',
    isOversubscribed: false,
    apy: 0,
    slashes: 0,
  },
  {
    id: '8',
    address: '5CXFinqBcs3Xo5uFv5THH7X2a6xdmqXp8RdPqDGPLT5RZDFL',
    totalStake: '0 SEL',
    ownStake: '100,000 SEL',
    nominators: 0,
    commission: 5,
    blocksProduced: 0,
    eraPoints: 0,
    status: 'inactive',
    isOversubscribed: false,
    apy: 0,
    slashes: 2,
  },
];

function formatAddress(address: string): string {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export default function ValidatorsExplorer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'waiting' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'stake' | 'commission' | 'nominators' | 'apy'>('stake');
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  };

  const filteredValidators = mockValidators
    .filter((validator) => {
      const matchesSearch =
        validator.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        validator.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        validator.identity?.display.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || validator.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'stake':
          return (
            parseFloat(b.totalStake.replace(/[^0-9.]/g, '')) - parseFloat(a.totalStake.replace(/[^0-9.]/g, ''))
          );
        case 'commission':
          return a.commission - b.commission;
        case 'nominators':
          return b.nominators - a.nominators;
        case 'apy':
          return b.apy - a.apy;
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: Validator['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400">
            <CheckCircle className="h-3 w-3" />
            Active
          </span>
        );
      case 'waiting':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
            <Clock className="h-3 w-3" />
            Waiting
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
            <XCircle className="h-3 w-3" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Validators</h1>
          <p className="text-gray-400 mt-1">Network validators and staking information</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Total Validators</span>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{mockStats.totalValidators}</p>
          <p className="text-sm text-green-400 mt-1">
            {mockStats.activeValidators} active, {mockStats.waitingValidators} waiting
          </p>
        </div>

        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Total Staked</span>
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Coins className="h-5 w-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{mockStats.totalStaked}</p>
          <p className="text-sm text-gray-400 mt-1">62.5% of total supply</p>
        </div>

        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Average Commission</span>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{mockStats.averageCommission}%</p>
          <p className="text-sm text-gray-400 mt-1">Range: 0% - 15%</p>
        </div>

        <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Minimum Stake</span>
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Shield className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{mockStats.minStake}</p>
          <p className="text-sm text-gray-400 mt-1">To become a validator</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-selendra-card border border-selendra-border rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-selendra-primary"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-3 bg-selendra-card border border-selendra-border rounded-xl text-white focus:outline-none focus:border-selendra-primary appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="waiting">Waiting</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-3 bg-selendra-card border border-selendra-border rounded-xl text-white focus:outline-none focus:border-selendra-primary appearance-none cursor-pointer"
          >
            <option value="stake">Sort by Stake</option>
            <option value="commission">Sort by Commission</option>
            <option value="nominators">Sort by Nominators</option>
            <option value="apy">Sort by APY</option>
          </select>
        </div>
      </div>

      {/* Validators Table */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-selendra-dark/50">
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm w-8"></th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">#</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Validator</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Total Stake</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Nominators</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Commission</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">APY</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Status</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-selendra-border">
              {filteredValidators.map((validator, index) => (
                <tr key={validator.id} className="hover:bg-selendra-dark/30 transition-colors">
                  <td className="py-4 px-4">
                    <button
                      onClick={() => toggleFavorite(validator.id)}
                      className="text-gray-400 hover:text-yellow-400 transition-colors"
                    >
                      {favorites.includes(validator.id) ? (
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-500">{index + 1}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-selendra-primary to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(validator.identity?.display || validator.name || validator.address).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">
                            {validator.identity?.display || validator.name || formatAddress(validator.address)}
                          </span>
                          {validator.isOversubscribed && (
                            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">
                              Oversubscribed
                            </span>
                          )}
                          {validator.slashes > 0 && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {validator.slashes} slash
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 text-sm font-mono">{formatAddress(validator.address)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <p className="text-white font-medium">{validator.totalStake}</p>
                    <p className="text-gray-500 text-sm">Own: {validator.ownStake}</p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-300">{validator.nominators}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={cn(
                        'font-medium',
                        validator.commission <= 5 ? 'text-green-400' : validator.commission <= 10 ? 'text-yellow-400' : 'text-red-400'
                      )}
                    >
                      {validator.commission}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {validator.apy > 0 ? (
                      <span className="text-green-400 font-medium">{validator.apy}%</span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="py-4 px-4">{getStatusBadge(validator.status)}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-selendra-primary text-white text-sm rounded-lg hover:bg-selendra-primary/90 transition-colors">
                        Nominate
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-selendra-card border border-selendra-border rounded-xl p-5">
        <h3 className="text-white font-medium mb-4">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-gray-400">Active - Currently validating</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-gray-400">Waiting - In election queue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
            <span className="text-gray-400">Inactive - Not participating</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-gray-400">Slashed - Has been penalized</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">Oversubscribed</span>
            <span className="text-gray-400">Too many nominators</span>
          </div>
        </div>
      </div>
    </div>
  );
}
