"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePreferences } from "@/lib/stores/preferences";

// Types
interface AccountTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface AccountLabel {
  address: string;
  name: string;
  tags: string[]; // tag ids
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// Predefined colors for tags
const TAG_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Gray", value: "#6b7280" },
];

// Default tags
const DEFAULT_TAGS: AccountTag[] = [
  {
    id: "personal",
    name: "Personal",
    color: "#3b82f6",
    description: "Personal accounts",
  },
  {
    id: "exchange",
    name: "Exchange",
    color: "#f97316",
    description: "Exchange wallets",
  },
  {
    id: "defi",
    name: "DeFi",
    color: "#22c55e",
    description: "DeFi protocol accounts",
  },
  {
    id: "staking",
    name: "Staking",
    color: "#a855f7",
    description: "Staking accounts",
  },
  { id: "cold", name: "Cold", color: "#6b7280", description: "Cold storage" },
  {
    id: "hot",
    name: "Hot",
    color: "#ef4444",
    description: "Hot/active wallets",
  },
  {
    id: "contract",
    name: "Contract",
    color: "#14b8a6",
    description: "Smart contracts",
  },
  {
    id: "multisig",
    name: "Multisig",
    color: "#ec4899",
    description: "Multisig accounts",
  },
];

// Storage keys
const TAGS_STORAGE_KEY = "selendra-account-tags";
const LABELS_STORAGE_KEY = "selendra-account-labels";

// Helper functions
function shortenAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 13) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// TagBadge Component
function TagBadge({
  tag,
  onRemove,
  size = "sm",
}: {
  tag: AccountTag;
  onRemove?: () => void;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      }`}
      style={{
        backgroundColor: `${tag.color}20`,
        borderColor: `${tag.color}50`,
        color: tag.color,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      {tag.name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:opacity-75 transition-opacity"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

// TagManager Component
function TagManager({
  tags,
  onAdd,
  onUpdate,
  onDelete,
}: {
  tags: AccountTag[];
  onAdd: (tag: Omit<AccountTag, "id">) => void;
  onUpdate: (tag: AccountTag) => void;
  onDelete: (id: string) => void;
}) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<AccountTag | null>(null);
  const [newTag, setNewTag] = useState({
    name: "",
    color: TAG_COLORS[0].value,
    description: "",
  });

  const handleSubmit = () => {
    if (!newTag.name.trim()) return;

    if (editingTag) {
      onUpdate({
        ...editingTag,
        name: newTag.name.trim(),
        color: newTag.color,
        description: newTag.description.trim() || undefined,
      });
      setEditingTag(null);
    } else {
      onAdd({
        name: newTag.name.trim(),
        color: newTag.color,
        description: newTag.description.trim() || undefined,
      });
    }

    setNewTag({ name: "", color: TAG_COLORS[0].value, description: "" });
    setIsAddingTag(false);
  };

  const startEditing = (tag: AccountTag) => {
    setEditingTag(tag);
    setNewTag({
      name: tag.name,
      color: tag.color,
      description: tag.description || "",
    });
    setIsAddingTag(true);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setNewTag({ name: "", color: TAG_COLORS[0].value, description: "" });
    setIsAddingTag(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Manage Tags</h3>
        {!isAddingTag && (
          <button
            onClick={() => setIsAddingTag(true)}
            className="btn-primary text-sm px-3 py-1.5"
          >
            + Add Tag
          </button>
        )}
      </div>

      {/* Add/Edit Tag Form */}
      {isAddingTag && (
        <div className="card p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-foreground-secondary mb-1">
                Tag Name
              </label>
              <input
                type="text"
                value={newTag.name}
                onChange={(e) =>
                  setNewTag({ ...newTag, name: e.target.value })
                }
                placeholder="e.g., Savings"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
              />
            </div>
            <div>
              <label className="block text-sm text-foreground-secondary mb-1">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewTag({ ...newTag, color: color.value })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      newTag.color === color.value
                        ? "scale-110 border-white"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-foreground-secondary mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={newTag.description}
              onChange={(e) =>
                setNewTag({ ...newTag, description: e.target.value })
              }
              placeholder="What is this tag for?"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={cancelEdit} className="btn-ghost text-sm px-4 py-2">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!newTag.name.trim()}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
            >
              {editingTag ? "Update Tag" : "Add Tag"}
            </button>
          </div>
        </div>
      )}

      {/* Tags List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="card p-3 flex items-center justify-between hover:border-selendra-500/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {tag.name}
                </div>
                {tag.description && (
                  <div className="text-xs text-foreground-secondary">
                    {tag.description}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEditing(tag)}
                className="text-foreground-secondary hover:text-foreground transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDelete(tag.id)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// AccountLabelCard Component
function AccountLabelCard({
  label,
  tags,
  onUpdate,
  onDelete,
}: {
  label: AccountLabel;
  tags: AccountTag[];
  onUpdate: (label: AccountLabel) => void;
  onDelete: (address: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: label.name,
    notes: label.notes || "",
    tags: label.tags,
  });

  const handleSave = () => {
    onUpdate({
      ...label,
      name: editData.name.trim(),
      notes: editData.notes.trim() || undefined,
      tags: editData.tags,
      updatedAt: Date.now(),
    });
    setIsEditing(false);
  };

  const toggleTag = (tagId: string) => {
    if (editData.tags.includes(tagId)) {
      setEditData({
        ...editData,
        tags: editData.tags.filter((t) => t !== tagId),
      });
    } else {
      setEditData({
        ...editData,
        tags: [...editData.tags, tagId],
      });
    }
  };

  const labelTags = label.tags
    .map((tid) => tags.find((t) => t.id === tid))
    .filter(Boolean) as AccountTag[];

  return (
    <div className="card p-4 hover:border-selendra-500/30 transition-colors">
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-foreground-secondary mb-1">
              Label Name
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-selendra-500"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground-secondary mb-1">
              Notes
            </label>
            <textarea
              value={editData.notes}
              onChange={(e) =>
                setEditData({ ...editData, notes: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-selendra-500"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground-secondary mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all ${
                    editData.tags.includes(tag.id)
                      ? "opacity-100"
                      : "opacity-40 hover:opacity-70"
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: `${tag.color}50`,
                    color: tag.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsEditing(false)}
              className="btn-ghost text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!editData.name.trim()}
              className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-lg font-medium text-foreground">
                {label.name}
              </div>
              <div className="font-mono text-sm text-foreground-secondary">
                {shortenAddress(label.address)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-foreground-secondary hover:text-foreground transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={() => onDelete(label.address)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {labelTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {labelTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} />
              ))}
            </div>
          )}

          {label.notes && (
            <p className="text-sm text-foreground-secondary">{label.notes}</p>
          )}

          <div className="mt-3 pt-3 border-t border-border text-xs text-foreground-secondary">
            Updated: {new Date(label.updatedAt).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}

// AddLabelForm Component
function AddLabelForm({
  tags,
  onAdd,
  onCancel,
}: {
  tags: AccountTag[];
  onAdd: (label: Omit<AccountLabel, "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    address: "",
    name: "",
    notes: "",
    tags: [] as string[],
  });

  const handleSubmit = () => {
    if (!formData.address.trim() || !formData.name.trim()) return;

    onAdd({
      address: formData.address.trim(),
      name: formData.name.trim(),
      notes: formData.notes.trim() || undefined,
      tags: formData.tags,
    });
  };

  const toggleTag = (tagId: string) => {
    if (formData.tags.includes(tagId)) {
      setFormData({
        ...formData,
        tags: formData.tags.filter((t) => t !== tagId),
      });
    } else {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagId],
      });
    }
  };

  return (
    <div className="card p-4 space-y-4">
      <h4 className="text-lg font-medium text-foreground">Label an Account</h4>

      <div>
        <label className="block text-sm text-foreground-secondary mb-1">
          Address *
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) =>
            setFormData({ ...formData, address: e.target.value })
          }
          placeholder="5xxxx... or 0x..."
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-mono placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
        />
      </div>

      <div>
        <label className="block text-sm text-foreground-secondary mb-1">
          Label Name *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., My Savings Account"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
        />
      </div>

      <div>
        <label className="block text-sm text-foreground-secondary mb-1">
          Notes (optional)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
          placeholder="Any additional notes..."
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground resize-none placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
        />
      </div>

      <div>
        <label className="block text-sm text-foreground-secondary mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all ${
                formData.tags.includes(tag.id)
                  ? "opacity-100"
                  : "opacity-40 hover:opacity-70"
              }`}
              style={{
                backgroundColor: `${tag.color}20`,
                borderColor: `${tag.color}50`,
                color: tag.color,
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-ghost text-sm px-4 py-2">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.address.trim() || !formData.name.trim()}
          className="btn-primary text-sm px-4 py-2 disabled:opacity-50"
        >
          Add Label
        </button>
      </div>
    </div>
  );
}

// Main AccountTags Component
export function AccountTags() {
  const [activeTab, setActiveTab] = useState<"labels" | "tags">("labels");
  const [tags, setTags] = useState<AccountTag[]>([]);
  const [labels, setLabels] = useState<AccountLabel[]>([]);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedTags = localStorage.getItem(TAGS_STORAGE_KEY);
      if (savedTags) {
        setTags(JSON.parse(savedTags));
      } else {
        setTags(DEFAULT_TAGS);
        localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(DEFAULT_TAGS));
      }

      const savedLabels = localStorage.getItem(LABELS_STORAGE_KEY);
      if (savedLabels) {
        setLabels(JSON.parse(savedLabels));
      }
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
      setTags(DEFAULT_TAGS);
    }
  }, []);

  // Save to localStorage
  const saveTags = useCallback((newTags: AccountTag[]) => {
    setTags(newTags);
    localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(newTags));
  }, []);

  const saveLabels = useCallback((newLabels: AccountLabel[]) => {
    setLabels(newLabels);
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(newLabels));
  }, []);

  // Tag operations
  const addTag = (tag: Omit<AccountTag, "id">) => {
    const newTag: AccountTag = {
      ...tag,
      id: generateId(),
    };
    saveTags([...tags, newTag]);
  };

  const updateTag = (updatedTag: AccountTag) => {
    saveTags(tags.map((t) => (t.id === updatedTag.id ? updatedTag : t)));
  };

  const deleteTag = (id: string) => {
    if (
      !window.confirm(
        "Delete this tag? It will be removed from all labeled accounts."
      )
    ) {
      return;
    }
    saveTags(tags.filter((t) => t.id !== id));
    // Remove tag from all labels
    saveLabels(
      labels.map((l) => ({
        ...l,
        tags: l.tags.filter((tid) => tid !== id),
        updatedAt: Date.now(),
      }))
    );
  };

  // Label operations
  const addLabel = (label: Omit<AccountLabel, "createdAt" | "updatedAt">) => {
    // Check if address already has a label
    if (labels.some((l) => l.address.toLowerCase() === label.address.toLowerCase())) {
      alert("This address already has a label.");
      return;
    }

    const newLabel: AccountLabel = {
      ...label,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveLabels([...labels, newLabel]);
    setIsAddingLabel(false);
  };

  const updateLabel = (updatedLabel: AccountLabel) => {
    saveLabels(
      labels.map((l) =>
        l.address === updatedLabel.address ? updatedLabel : l
      )
    );
  };

  const deleteLabel = (address: string) => {
    if (!window.confirm("Remove this label?")) return;
    saveLabels(labels.filter((l) => l.address !== address));
  };

  // Filter labels
  const filteredLabels = labels.filter((label) => {
    const matchesSearch =
      !searchQuery ||
      label.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      label.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      label.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTag = !filterTag || label.tags.includes(filterTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Account Tags & Labels
        </h2>
        <p className="text-sm text-foreground-secondary mt-1">
          Organize and label your accounts with custom tags
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("labels")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "labels"
              ? "border-selendra-500 text-selendra-400"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          Labeled Accounts
          {labels.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-selendra-500/20 text-selendra-400">
              {labels.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("tags")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "tags"
              ? "border-selendra-500 text-selendra-400"
              : "border-transparent text-foreground-secondary hover:text-foreground"
          }`}
        >
          Manage Tags
          {tags.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-selendra-500/20 text-selendra-400">
              {tags.length}
            </span>
          )}
        </button>
      </div>

      {/* Labels Tab */}
      {activeTab === "labels" && (
        <div className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search labels..."
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-selendra-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterTag(null)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                  !filterTag
                    ? "bg-selendra-500/20 border-selendra-500/50 text-selendra-400"
                    : "border-border text-foreground-secondary hover:text-foreground"
                }`}
              >
                All
              </button>
              {tags.slice(0, 5).map((tag) => (
                <button
                  key={tag.id}
                  onClick={() =>
                    setFilterTag(filterTag === tag.id ? null : tag.id)
                  }
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm border transition-colors ${
                    filterTag === tag.id
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: `${tag.color}50`,
                    color: tag.color,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Add Label Button */}
          {!isAddingLabel && (
            <button
              onClick={() => setIsAddingLabel(true)}
              className="btn-primary text-sm px-4 py-2"
            >
              + Label an Account
            </button>
          )}

          {/* Add Label Form */}
          {isAddingLabel && (
            <AddLabelForm
              tags={tags}
              onAdd={addLabel}
              onCancel={() => setIsAddingLabel(false)}
            />
          )}

          {/* Labels Grid */}
          {filteredLabels.length === 0 ? (
            <div className="card p-8 text-center">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-foreground-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <h4 className="text-lg font-medium text-foreground mb-2">
                {searchQuery || filterTag
                  ? "No matching labels"
                  : "No labeled accounts"}
              </h4>
              <p className="text-sm text-foreground-secondary">
                {searchQuery || filterTag
                  ? "Try adjusting your search or filter"
                  : "Label your accounts to keep them organized"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLabels.map((label) => (
                <AccountLabelCard
                  key={label.address}
                  label={label}
                  tags={tags}
                  onUpdate={updateLabel}
                  onDelete={deleteLabel}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tags Tab */}
      {activeTab === "tags" && (
        <TagManager
          tags={tags}
          onAdd={addTag}
          onUpdate={updateTag}
          onDelete={deleteTag}
        />
      )}

      {/* Info Section */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          About Account Labels
        </h4>
        <ul className="space-y-1 text-sm text-foreground-secondary">
          <li>• Labels help you identify and organize your accounts</li>
          <li>• Create custom tags to categorize accounts (e.g., DeFi, Staking)</li>
          <li>• Add notes for additional context about each account</li>
          <li>• Labels are stored locally in your browser</li>
          <li>• Use search and filters to quickly find labeled accounts</li>
        </ul>
      </div>
    </div>
  );
}
