"use client";

import React, { useState } from "react";
import {
  Activity,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle,
  Loader2,
  Download,
  Info,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface EventLogsProps {
  address: string;
}

interface EventLog {
  id: string;
  transactionHash: string;
  blockNumber: number;
  eventName: string;
  args: Record<string, any>;
  timestamp: Date;
  logIndex: number;
  topics: string[];
}

// Mock event logs
const mockEventLogs: EventLog[] = [
  {
    id: "1",
    transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    blockNumber: 1234567,
    eventName: "Transfer",
    args: {
      from: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      to: "0x123abc456def789ghi012jkl345mno678pqr",
      value: "1000000000000000000000",
    },
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    logIndex: 0,
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
      "0x000000000000000000000000123abc456def789ghi012jkl345mno678pqr",
    ],
  },
  {
    id: "2",
    transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    blockNumber: 1234566,
    eventName: "Approval",
    args: {
      owner: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      spender: "0x7c3aed6b8c5f4e2a1d0b9f3e8a4c6d7b9e0f1a2b",
      value: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    logIndex: 1,
    topics: [
      "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925",
      "0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
      "0x0000000000000000000000007c3aed6b8c5f4e2a1d0b9f3e8a4c6d7b9e0f1a2b",
    ],
  },
  {
    id: "3",
    transactionHash: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    blockNumber: 1234565,
    eventName: "Transfer",
    args: {
      from: "0x0000000000000000000000000000000000000000",
      to: "0x742d35cc6634c0532925a3b844bc454e4438f44e",
      value: "5000000000000000000000000",
    },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    logIndex: 0,
    topics: [
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
      "0x0000000000000000000000000000000000000000000000000000000000000000",
      "0x000000000000000000000000742d35cc6634c0532925a3b844bc454e4438f44e",
    ],
  },
];

export const EventLogs: React.FC<EventLogsProps> = ({ address }) => {
  const [events, setEvents] = useState<EventLog[]>(mockEventLogs);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const eventsPerPage = 10;

  // Get unique event names for filter
  const eventNames = [...new Set(events.map((e) => e.eventName))];

  // Filter events
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.transactionHash.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterEvent === "all" || event.eventName === filterEvent;
    return matchesSearch && matchesFilter;
  });

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * eventsPerPage,
    currentPage * eventsPerPage
  );

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const toggleEventExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const formatValue = (value: any, key: string): string => {
    if (typeof value === "string") {
      // Check if it's an address
      if (value.startsWith("0x") && value.length === 42) {
        return value;
      }
      // Check if it's a large number (likely a token amount)
      if (/^\d+$/.test(value) && value.length > 10) {
        const num = BigInt(value);
        const formatted = (Number(num) / 10 ** 18).toLocaleString(undefined, {
          maximumFractionDigits: 4,
        });
        return `${formatted} (${value})`;
      }
    }
    return String(value);
  };

  const getEventColor = (eventName: string): string => {
    switch (eventName) {
      case "Transfer":
        return "bg-green-500/20 text-green-400";
      case "Approval":
        return "bg-blue-500/20 text-blue-400";
      case "Blacklisted":
        return "bg-red-500/20 text-red-400";
      case "UnBlacklisted":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-purple-500/20 text-purple-400";
    }
  };

  const exportEvents = () => {
    const csvContent = [
      ["Block", "Tx Hash", "Event", "Timestamp", "Args"].join(","),
      ...filteredEvents.map((event) =>
        [
          event.blockNumber,
          event.transactionHash,
          event.eventName,
          event.timestamp.toISOString(),
          JSON.stringify(event.args),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `events_${address.slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Events exported!");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-selendra-400" />
            <h3 className="text-lg font-semibold">Event Logs</h3>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-medium">
              {filteredEvents.length} events
            </span>
          </div>
          <p className="text-sm text-foreground-secondary">
            Decoded event logs emitted by this contract
          </p>
        </div>
        <button
          onClick={exportEvents}
          className="flex items-center gap-2 px-4 py-2 bg-background-secondary hover:bg-background-hover border border-border rounded-lg transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by event name or tx hash..."
            className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
          />
        </div>
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value)}
          className="px-4 py-2.5 bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-selendra-500 transition-colors"
        >
          <option value="all">All Events</option>
          {eventNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Info Box */}
      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-400">Event Decoding</p>
            <p className="text-foreground-secondary mt-1">
              Events are automatically decoded using the contract ABI. Click on an event to see raw topics and data.
            </p>
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-selendra-500" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-foreground-secondary">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events found for this contract.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedEvents.map((event) => {
            const isExpanded = expandedEvents.has(event.id);
            return (
              <div
                key={event.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                {/* Event Header */}
                <button
                  onClick={() => toggleEventExpand(event.id)}
                  className="w-full flex items-center justify-between p-4 bg-background-secondary hover:bg-background-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(event.eventName)}`}>
                      {event.eventName}
                    </span>
                    <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <span>Block {event.blockNumber.toLocaleString()}</span>
                      <span>•</span>
                      <span>
                        {Math.floor((Date.now() - event.timestamp.getTime()) / (1000 * 60))} mins ago
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/tx/${event.transactionHash}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-xs text-selendra-400 hover:text-selendra-300"
                    >
                      {event.transactionHash.slice(0, 10)}...{event.transactionHash.slice(-8)}
                    </Link>
                    <ExternalLink className="w-4 h-4 text-foreground-secondary" />
                  </div>
                </button>

                {/* Event Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-border space-y-4">
                    {/* Decoded Args */}
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary mb-2">
                        Decoded Parameters
                      </p>
                      <div className="space-y-2">
                        {Object.entries(event.args).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between p-2 bg-background-secondary rounded-lg"
                          >
                            <span className="text-sm text-cyan-400">{key}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono break-all text-right max-w-md">
                                {typeof value === "string" && value.startsWith("0x") && value.length === 42 ? (
                                  <Link
                                    href={`/address/${value}`}
                                    className="text-selendra-400 hover:text-selendra-300"
                                  >
                                    {value.slice(0, 10)}...{value.slice(-8)}
                                  </Link>
                                ) : (
                                  formatValue(value, key)
                                )}
                              </span>
                              <button
                                onClick={() => copyToClipboard(String(value), key)}
                                className="p-1 hover:bg-background-hover rounded transition-colors"
                              >
                                {copiedText === key ? (
                                  <CheckCircle className="w-3 h-3 text-green-400" />
                                ) : (
                                  <Copy className="w-3 h-3 text-foreground-secondary" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Raw Topics */}
                    <div>
                      <p className="text-sm font-medium text-foreground-secondary mb-2">
                        Raw Topics
                      </p>
                      <div className="space-y-1">
                        {event.topics.map((topic, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 p-2 bg-[#1a1b26] rounded-lg"
                          >
                            <span className="text-xs text-foreground-secondary w-4">{index}</span>
                            <code className="font-mono text-xs text-yellow-400 flex-1 break-all">
                              {topic}
                            </code>
                            <button
                              onClick={() => copyToClipboard(topic, `topic-${index}`)}
                              className="p-1 hover:bg-background-hover rounded transition-colors"
                            >
                              <Copy className="w-3 h-3 text-foreground-secondary" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-foreground-secondary">
            Showing {(currentPage - 1) * eventsPerPage + 1} to{" "}
            {Math.min(currentPage * eventsPerPage, filteredEvents.length)} of{" "}
            {filteredEvents.length} events
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === pageNum
                    ? "bg-selendra-600 text-white"
                    : "bg-background-secondary hover:bg-background-hover"
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-background-secondary hover:bg-background-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventLogs;
