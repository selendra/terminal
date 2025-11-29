"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
  Star,
  StarOff,
  Download,
  Upload,
  Filter,
  Tag,
  User,
  Building2,
  Wallet,
  AlertCircle,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { AddressDisplay, VMBadge } from "../common";
import { isEvmAddress, isSubstrateAddress, detectAddressType } from "@/lib/address";

interface Contact {
  id: string;
  name: string;
  address: string;
  type: "substrate" | "evm" | "both";
  tags: string[];
  notes?: string;
  favorite: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

const STORAGE_KEY = "selendra_address_book";

// Default tags
const DEFAULT_TAGS = [
  "Personal",
  "Exchange",
  "DeFi",
  "Business",
  "Friend",
  "Family",
  "Developer",
  "Validator",
];

export function AddressBook() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Load contacts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setContacts(
          parsed.map((c: Contact) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            lastUsed: c.lastUsed ? new Date(c.lastUsed) : undefined,
          }))
        );
      } catch {
        console.error("Failed to parse contacts");
      }
    }
  }, []);

  // Save contacts to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  const addContact = (contact: Omit<Contact, "id" | "createdAt">) => {
    const newContact: Contact = {
      ...contact,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setContacts((prev) => [...prev, newContact]);
    toast.success("Contact added");
    setShowAddModal(false);
  };

  const updateContact = (id: string, updates: Partial<Contact>) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
    toast.success("Contact updated");
    setEditingContact(null);
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contact deleted");
    setSelectedContact(null);
  };

  const toggleFavorite = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, favorite: !c.favorite } : c))
    );
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied!");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const exportContacts = () => {
    const data = JSON.stringify(contacts, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `selendra-address-book-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Contacts exported");
  };

  const importContacts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          const validContacts = imported.filter(
            (c) => c.name && c.address && (isEvmAddress(c.address) || isSubstrateAddress(c.address))
          );
          setContacts((prev) => [
            ...prev,
            ...validContacts.map((c: Contact) => ({
              ...c,
              id: crypto.randomUUID(),
              createdAt: new Date(),
            })),
          ]);
          toast.success(`Imported ${validContacts.length} contacts`);
        }
      } catch {
        toast.error("Invalid file format");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  // Get all unique tags from contacts
  const allTags = Array.from(
    new Set([...DEFAULT_TAGS, ...contacts.flatMap((c) => c.tags)])
  );

  // Filter contacts
  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = !filterTag || contact.tags.includes(filterTag);
    const matchesFavorite = !showFavoritesOnly || contact.favorite;
    return matchesSearch && matchesTag && matchesFavorite;
  });

  // Sort: favorites first, then by name
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-selendra-400" />
            Address Book
          </h1>
          <p className="text-foreground-secondary mt-1">
            Manage your saved contacts and addresses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg cursor-pointer transition-colors">
            <Upload className="h-5 w-5" />
            <input
              type="file"
              accept=".json"
              onChange={importContacts}
              className="hidden"
            />
          </label>
          <button
            onClick={exportContacts}
            disabled={contacts.length === 0}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors disabled:opacity-50"
            title="Export contacts"
          >
            <Download className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-selendra-600 hover:bg-selendra-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        </div>
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
            className="w-full pl-10 pr-4 py-3 bg-background-card border border-border rounded-xl text-foreground placeholder:text-foreground-secondary focus:outline-none focus:border-selendra-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={clsx(
              "flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors",
              showFavoritesOnly
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                : "border-border bg-background-card text-foreground-secondary hover:text-foreground"
            )}
          >
            <Star className="h-4 w-4" />
            Favorites
          </button>
          <select
            value={filterTag || ""}
            onChange={(e) => setFilterTag(e.target.value || null)}
            className="px-4 py-3 bg-background-card border border-border rounded-xl text-foreground focus:outline-none focus:border-selendra-500"
          >
            <option value="">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">Total Contacts</p>
          <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">Favorites</p>
          <p className="text-2xl font-bold text-yellow-400">
            {contacts.filter((c) => c.favorite).length}
          </p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">Substrate</p>
          <p className="text-2xl font-bold text-blue-400">
            {contacts.filter((c) => c.type === "substrate").length}
          </p>
        </div>
        <div className="bg-background-card border border-border rounded-xl p-4">
          <p className="text-sm text-foreground-secondary">EVM</p>
          <p className="text-2xl font-bold text-purple-400">
            {contacts.filter((c) => c.type === "evm").length}
          </p>
        </div>
      </div>

      {/* Contacts List */}
      {sortedContacts.length > 0 ? (
        <div className="bg-background-card border border-border rounded-xl divide-y divide-border">
          {sortedContacts.map((contact) => (
            <div
              key={contact.id}
              className="p-4 hover:bg-background-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                      contact.type === "evm"
                        ? "bg-purple-500/20"
                        : "bg-blue-500/20"
                    )}
                  >
                    <User
                      className={clsx(
                        "h-5 w-5",
                        contact.type === "evm" ? "text-purple-500" : "text-blue-500"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {contact.name}
                      </h3>
                      {contact.favorite && (
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                      )}
                      <VMBadge vm={contact.type === "evm" ? "evm" : "substrate"} size="sm" />
                    </div>
                    <AddressDisplay
                      address={contact.address}
                      type={contact.type === "evm" ? "evm" : "substrate"}
                      size="sm"
                      showCopy={false}
                      showToggle={false}
                    />
                    {contact.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-background rounded text-foreground-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {contact.notes && (
                      <p className="text-sm text-foreground-secondary mt-1 truncate">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleFavorite(contact.id)}
                    className="p-2 text-foreground-secondary hover:text-yellow-400 transition-colors"
                    title={contact.favorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    {contact.favorite ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => copyAddress(contact.address)}
                    className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
                    title="Copy address"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingContact(contact)}
                    className="p-2 text-foreground-secondary hover:text-foreground transition-colors"
                    title="Edit contact"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    className="p-2 text-foreground-secondary hover:text-red-400 transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-background-card border border-border rounded-xl p-12 text-center">
          {contacts.length === 0 ? (
            <>
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Contacts Yet
              </h2>
              <p className="text-foreground-secondary mb-6 max-w-md mx-auto">
                Start building your address book by adding contacts you frequently
                interact with.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-selendra-600 hover:bg-selendra-700 text-white rounded-xl transition-colors"
              >
                Add Your First Contact
              </button>
            </>
          ) : (
            <>
              <Search className="h-16 w-16 mx-auto mb-4 text-foreground-secondary opacity-50" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No Results Found
              </h2>
              <p className="text-foreground-secondary">
                Try adjusting your search or filters.
              </p>
            </>
          )}
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {(showAddModal || editingContact) && (
        <ContactModal
          contact={editingContact}
          allTags={allTags}
          onSave={(contact) => {
            if (editingContact) {
              updateContact(editingContact.id, contact);
            } else {
              addContact(contact);
            }
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingContact(null);
          }}
        />
      )}
    </div>
  );
}

// Contact Modal Component
interface ContactModalProps {
  contact: Contact | null;
  allTags: string[];
  onSave: (contact: Omit<Contact, "id" | "createdAt">) => void;
  onClose: () => void;
}

function ContactModal({ contact, allTags, onSave, onClose }: ContactModalProps) {
  const [name, setName] = useState(contact?.name || "");
  const [address, setAddress] = useState(contact?.address || "");
  const [tags, setTags] = useState<string[]>(contact?.tags || []);
  const [notes, setNotes] = useState(contact?.notes || "");
  const [favorite, setFavorite] = useState(contact?.favorite || false);
  const [newTag, setNewTag] = useState("");
  const [addressError, setAddressError] = useState("");

  const validateAddress = (addr: string) => {
    if (!addr) {
      setAddressError("Address is required");
      return false;
    }
    if (!isEvmAddress(addr) && !isSubstrateAddress(addr)) {
      setAddressError("Invalid address format");
      return false;
    }
    setAddressError("");
    return true;
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!validateAddress(address)) {
      return;
    }

    const type = isEvmAddress(address) ? "evm" : "substrate";

    onSave({
      name: name.trim(),
      address,
      type,
      tags,
      notes: notes.trim() || undefined,
      favorite,
      lastUsed: contact?.lastUsed,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {contact ? "Edit Contact" : "Add Contact"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-foreground-secondary hover:text-foreground hover:bg-background-hover rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter contact name"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-secondary focus:outline-none focus:border-selendra-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Address *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (addressError) validateAddress(e.target.value);
              }}
              onBlur={() => validateAddress(address)}
              placeholder="Enter SS58 or 0x address"
              className={clsx(
                "w-full px-4 py-3 bg-background border rounded-xl text-foreground placeholder:text-foreground-secondary focus:outline-none",
                addressError ? "border-red-500" : "border-border focus:border-selendra-500"
              )}
            />
            {addressError && (
              <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {addressError}
              </p>
            )}
            {address && !addressError && (
              <div className="flex items-center gap-2 mt-2">
                <VMBadge
                  vm={isEvmAddress(address) ? "evm" : "substrate"}
                  size="sm"
                  showLabel
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-selendra-500/20 text-selendra-400 rounded text-sm"
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="hover:text-selendra-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="Add tag"
                list="tag-suggestions"
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-foreground-secondary text-sm focus:outline-none focus:border-selendra-500"
              />
              <datalist id="tag-suggestions">
                {allTags
                  .filter((t) => !tags.includes(t))
                  .map((tag) => (
                    <option key={tag} value={tag} />
                  ))}
              </datalist>
              <button
                onClick={addTag}
                className="px-3 py-2 bg-background-tertiary hover:bg-background-hover border border-border rounded-lg text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this contact"
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-foreground-secondary focus:outline-none focus:border-selendra-500 resize-none"
            />
          </div>

          {/* Favorite */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={favorite}
              onChange={(e) => setFavorite(e.target.checked)}
              className="sr-only"
            />
            <div
              className={clsx(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                favorite
                  ? "bg-yellow-500 border-yellow-500"
                  : "border-border"
              )}
            >
              {favorite && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-foreground">Add to favorites</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-border rounded-xl text-foreground hover:bg-background-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-selendra-600 hover:bg-selendra-700 text-white rounded-xl transition-colors"
          >
            {contact ? "Save Changes" : "Add Contact"}
          </button>
        </div>
      </div>
    </div>
  );
}
