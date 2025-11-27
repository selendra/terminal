'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Globe,
  Bell,
  Shield,
  Wallet,
  Monitor,
  Smartphone,
  Check,
  ChevronRight,
  ExternalLink,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  symbol: string;
  explorer: string;
}

const defaultNetworks: NetworkConfig[] = [
  {
    name: 'Selendra Mainnet',
    rpcUrl: 'https://rpc-evm.selendra.org',
    chainId: 1961,
    symbol: 'SEL',
    explorer: 'https://explorer.selendra.org',
  },
  {
    name: 'Selendra Testnet',
    rpcUrl: 'https://rpc-evm-testnet.selendra.org',
    chainId: 1953,
    symbol: 'tSEL',
    explorer: 'https://testnet.selendra.org',
  },
];

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [notifications, setNotifications] = useState({
    transactions: true,
    governance: true,
    staking: true,
    price: false,
    marketing: false,
  });
  const [privacy, setPrivacy] = useState({
    analytics: true,
    errorReporting: true,
    personalizedAds: false,
  });
  const [selectedNetwork, setSelectedNetwork] = useState(0);
  const [showAddNetwork, setShowAddNetwork] = useState(false);
  const [newNetwork, setNewNetwork] = useState<Partial<NetworkConfig>>({});

  const sections = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'network', label: 'Network', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'display', label: 'Display', icon: Monitor },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your preferences and account settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-selendra-card border border-selendra-border rounded-xl p-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                    activeSection === section.id
                      ? 'bg-selendra-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-selendra-dark'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Appearance</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Theme</label>
                    <div className="flex gap-3">
                      {[
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'system', label: 'System', icon: Monitor },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value as typeof theme)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                            theme === value
                              ? 'border-selendra-primary bg-selendra-primary/20 text-white'
                              : 'border-selendra-border text-gray-400 hover:text-white'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Localization</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-selendra-dark border border-selendra-border rounded-lg text-white focus:outline-none focus:border-selendra-primary"
                    >
                      <option value="en">English</option>
                      <option value="km">ភាសាខ្មែរ (Khmer)</option>
                      <option value="zh">中文 (Chinese)</option>
                      <option value="ja">日本語 (Japanese)</option>
                      <option value="ko">한국어 (Korean)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-selendra-dark border border-selendra-border rounded-lg text-white focus:outline-none focus:border-selendra-primary"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="KHR">KHR (៛)</option>
                      <option value="CNY">CNY (¥)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Network Settings */}
          {activeSection === 'network' && (
            <div className="space-y-6">
              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Networks</h2>
                <div className="space-y-3">
                  {defaultNetworks.map((network, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedNetwork(index)}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                        selectedNetwork === index
                          ? 'border-selendra-primary bg-selendra-primary/10'
                          : 'border-selendra-border hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-selendra-primary flex items-center justify-center">
                          <span className="text-white font-bold">{network.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{network.name}</p>
                          <p className="text-gray-400 text-sm">Chain ID: {network.chainId}</p>
                        </div>
                      </div>
                      {selectedNetwork === index && (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowAddNetwork(!showAddNetwork)}
                  className="mt-4 w-full py-3 border border-dashed border-selendra-border rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                  + Add Custom Network
                </button>

                {showAddNetwork && (
                  <div className="mt-4 p-4 bg-selendra-dark rounded-lg space-y-4">
                    <input
                      type="text"
                      placeholder="Network Name"
                      className="w-full px-4 py-3 bg-selendra-card border border-selendra-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-selendra-primary"
                      onChange={(e) => setNewNetwork({ ...newNetwork, name: e.target.value })}
                    />
                    <input
                      type="text"
                      placeholder="RPC URL"
                      className="w-full px-4 py-3 bg-selendra-card border border-selendra-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-selendra-primary"
                      onChange={(e) => setNewNetwork({ ...newNetwork, rpcUrl: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Chain ID"
                        className="w-full px-4 py-3 bg-selendra-card border border-selendra-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-selendra-primary"
                        onChange={(e) => setNewNetwork({ ...newNetwork, chainId: parseInt(e.target.value) })}
                      />
                      <input
                        type="text"
                        placeholder="Symbol"
                        className="w-full px-4 py-3 bg-selendra-card border border-selendra-border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-selendra-primary"
                        onChange={(e) => setNewNetwork({ ...newNetwork, symbol: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowAddNetwork(false)}
                        className="flex-1 py-2 border border-selendra-border rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button className="flex-1 py-2 bg-selendra-primary text-white rounded-lg hover:bg-selendra-primary/90 transition-colors">
                        Add Network
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">RPC Endpoints</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Substrate RPC</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value="wss://rpc.selendra.org"
                        readOnly
                        className="flex-1 px-4 py-3 bg-selendra-dark border border-selendra-border rounded-lg text-gray-300"
                      />
                      <button className="p-3 bg-selendra-dark border border-selendra-border rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">EVM RPC</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value="https://rpc-evm.selendra.org"
                        readOnly
                        className="flex-1 px-4 py-3 bg-selendra-dark border border-selendra-border rounded-lg text-gray-300"
                      />
                      <button className="p-3 bg-selendra-dark border border-selendra-border rounded-lg text-gray-400 hover:text-white transition-colors">
                        <Copy className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeSection === 'notifications' && (
            <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'transactions', label: 'Transaction Updates', desc: 'Get notified when your transactions are confirmed' },
                  { key: 'governance', label: 'Governance', desc: 'New proposals and voting reminders' },
                  { key: 'staking', label: 'Staking Rewards', desc: 'Notifications about staking rewards and validator changes' },
                  { key: 'price', label: 'Price Alerts', desc: 'SEL price movement notifications' },
                  { key: 'marketing', label: 'Marketing', desc: 'News, updates, and promotional content' },
                ].map(({ key, label, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3 border-b border-selendra-border last:border-0"
                  >
                    <div>
                      <p className="text-white font-medium">{label}</p>
                      <p className="text-gray-400 text-sm">{desc}</p>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          [key]: !notifications[key as keyof typeof notifications],
                        })
                      }
                      className={cn(
                        'w-12 h-6 rounded-full transition-colors relative',
                        notifications[key as keyof typeof notifications]
                          ? 'bg-selendra-primary'
                          : 'bg-gray-600'
                      )}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform',
                          notifications[key as keyof typeof notifications]
                            ? 'translate-x-6'
                            : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Privacy Settings</h2>
                <div className="space-y-4">
                  {[
                    { key: 'analytics', label: 'Analytics', desc: 'Help improve the app by sharing anonymous usage data' },
                    { key: 'errorReporting', label: 'Error Reporting', desc: 'Automatically report crashes and errors' },
                    { key: 'personalizedAds', label: 'Personalized Content', desc: 'Show content based on your activity' },
                  ].map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-3 border-b border-selendra-border last:border-0"
                    >
                      <div>
                        <p className="text-white font-medium">{label}</p>
                        <p className="text-gray-400 text-sm">{desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          setPrivacy({
                            ...privacy,
                            [key]: !privacy[key as keyof typeof privacy],
                          })
                        }
                        className={cn(
                          'w-12 h-6 rounded-full transition-colors relative',
                          privacy[key as keyof typeof privacy] ? 'bg-selendra-primary' : 'bg-gray-600'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform',
                            privacy[key as keyof typeof privacy] ? 'translate-x-6' : 'translate-x-0.5'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Data Management</h2>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-4 bg-selendra-dark rounded-lg hover:bg-selendra-dark/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <Download className="h-5 w-5 text-gray-400" />
                      <span className="text-white">Export My Data</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-selendra-dark rounded-lg hover:bg-selendra-dark/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-gray-400" />
                      <span className="text-white">Clear Cache</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </button>
                  <button className="w-full flex items-center justify-between p-4 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <Trash2 className="h-5 w-5 text-red-400" />
                      <span className="text-red-400">Delete All Local Data</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wallet Settings */}
          {activeSection === 'wallet' && (
            <div className="space-y-6">
              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Connected Wallets</h2>
                <div className="text-center py-8 text-gray-400">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No wallets connected</p>
                  <button className="mt-4 px-6 py-2 bg-selendra-primary text-white rounded-lg hover:bg-selendra-primary/90 transition-colors">
                    Connect Wallet
                  </button>
                </div>
              </div>

              <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Wallet Preferences</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-white font-medium">Auto-connect</p>
                      <p className="text-gray-400 text-sm">Automatically connect to last used wallet</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-selendra-primary transition-colors relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 translate-x-6" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-white font-medium">Transaction Signing</p>
                      <p className="text-gray-400 text-sm">Always ask before signing transactions</p>
                    </div>
                    <button className="w-12 h-6 rounded-full bg-selendra-primary transition-colors relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Display Settings */}
          {activeSection === 'display' && (
            <div className="bg-selendra-card border border-selendra-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Display Options</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-selendra-border">
                  <div>
                    <p className="text-white font-medium">Compact Mode</p>
                    <p className="text-gray-400 text-sm">Show more content with smaller spacing</p>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-gray-600 transition-colors relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 translate-x-0.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-selendra-border">
                  <div>
                    <p className="text-white font-medium">Show Balance in Header</p>
                    <p className="text-gray-400 text-sm">Display your wallet balance in the top bar</p>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-selendra-primary transition-colors relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 translate-x-6" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-white font-medium">Hide Small Balances</p>
                    <p className="text-gray-400 text-sm">Hide tokens with balance less than $1</p>
                  </div>
                  <button className="w-12 h-6 rounded-full bg-gray-600 transition-colors relative">
                    <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
