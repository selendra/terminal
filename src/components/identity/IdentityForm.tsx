"use client";

import { useState, useCallback } from "react";
import {
  User,
  Mail,
  Globe,
  Twitter,
  Github,
  AtSign,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import { useBlockchain } from "@/components/providers/BlockchainProvider";
import { useWallet } from "@/components/providers/WalletProvider";

// =============================================================================
// Types
// =============================================================================

interface IdentityInfo {
  display: string;
  legal: string;
  web: string;
  email: string;
  twitter: string;
  github: string;
  matrix: string; // Element/Matrix handle
  image: string;
  pgpFingerprint: string;
}

interface IdentityFormProps {
  existingIdentity?: Partial<IdentityInfo>;
  onSuccess?: () => void;
  onClose?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function IdentityForm({
  existingIdentity,
  onSuccess,
  onClose,
}: IdentityFormProps) {
  const { substrateSDK, isConnected } = useBlockchain();
  const { selectedSubstrateAccount, signAndSubmitExtrinsic } = useWallet();

  // Form state
  const [formData, setFormData] = useState<IdentityInfo>({
    display: existingIdentity?.display || "",
    legal: existingIdentity?.legal || "",
    web: existingIdentity?.web || "",
    email: existingIdentity?.email || "",
    twitter: existingIdentity?.twitter || "",
    github: existingIdentity?.github || "",
    matrix: existingIdentity?.matrix || "",
    image: existingIdentity?.image || "",
    pgpFingerprint: existingIdentity?.pgpFingerprint || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof IdentityInfo, string>>>({});

  // Update form field
  const updateField = useCallback((field: keyof IdentityInfo, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof IdentityInfo, string>> = {};

    // Display name is required
    if (!formData.display.trim()) {
      newErrors.display = "Display name is required";
    } else if (formData.display.length > 32) {
      newErrors.display = "Display name must be 32 characters or less";
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Validate URL format if provided
    if (formData.web && !/^https?:\/\/.+/.test(formData.web)) {
      newErrors.web = "URL must start with http:// or https://";
    }

    // Validate Twitter handle
    if (formData.twitter && !/^@?[\w]{1,15}$/.test(formData.twitter)) {
      newErrors.twitter = "Invalid Twitter handle";
    }

    // Validate GitHub username
    if (formData.github && !/^[\w-]{1,39}$/.test(formData.github)) {
      newErrors.github = "Invalid GitHub username";
    }

    // Validate Matrix handle
    if (formData.matrix && !/^@[\w.]+:[\w.]+$/.test(formData.matrix)) {
      newErrors.matrix = "Invalid Matrix handle (e.g., @user:matrix.org)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Estimate fees
  const estimateFees = useCallback(async () => {
    if (!substrateSDK || !selectedSubstrateAccount) return;

    try {
      const api = (substrateSDK as { getApi?: () => unknown }).getApi?.() as {
        tx: {
          identity: {
            setIdentity: (info: unknown) => {
              paymentInfo: (address: string) => Promise<{ partialFee: { toString: () => string } }>;
            };
          };
        };
        consts: {
          identity: {
            basicDeposit?: { toString: () => string };
          };
        };
      };
      
      if (!api) return;

      // Create identity info structure for the chain
      const identityInfo = createIdentityInfo(formData);
      const tx = api.tx.identity.setIdentity(identityInfo);
      
      const info = await tx.paymentInfo(selectedSubstrateAccount.address);
      setEstimatedFee(formatBalance(info.partialFee.toString()));

      // Get deposit amount from constants
      const deposit = api.consts.identity?.basicDeposit;
      if (deposit) {
        setDepositAmount(formatBalance(deposit.toString()));
      }
    } catch (error) {
      console.error("Failed to estimate fees:", error);
    }
  }, [substrateSDK, selectedSubstrateAccount, formData]);

  // Submit identity
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;
    if (!substrateSDK || !selectedSubstrateAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    try {
      const api = (substrateSDK as { getApi?: () => unknown }).getApi?.() as {
        tx: {
          identity: {
            setIdentity: (info: unknown) => unknown;
          };
        };
      };
      
      if (!api) {
        throw new Error("API not available");
      }

      const identityInfo = createIdentityInfo(formData);
      const tx = api.tx.identity.setIdentity(identityInfo);

      await signAndSubmitExtrinsic(tx);
      
      toast.success("Identity set successfully!");
      onSuccess?.();
    } catch (error) {
      console.error("Failed to set identity:", error);
      toast.error("Failed to set identity");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, substrateSDK, selectedSubstrateAccount, signAndSubmitExtrinsic, validateForm, onSuccess]);

  // Clear identity
  const handleClear = useCallback(async () => {
    if (!substrateSDK || !selectedSubstrateAccount) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);
    try {
      const api = (substrateSDK as { getApi?: () => unknown }).getApi?.() as {
        tx: {
          identity: {
            clearIdentity: () => unknown;
          };
        };
      };
      
      if (!api) {
        throw new Error("API not available");
      }

      const tx = api.tx.identity.clearIdentity();
      await signAndSubmitExtrinsic(tx);
      
      toast.success("Identity cleared successfully!");
      setFormData({
        display: "",
        legal: "",
        web: "",
        email: "",
        twitter: "",
        github: "",
        matrix: "",
        image: "",
        pgpFingerprint: "",
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to clear identity:", error);
      toast.error("Failed to clear identity");
    } finally {
      setIsSubmitting(false);
    }
  }, [substrateSDK, selectedSubstrateAccount, signAndSubmitExtrinsic, onSuccess]);

  const hasExistingIdentity = !!existingIdentity?.display;

  return (
    <div className="card max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-selendra-400" />
            {hasExistingIdentity ? "Update Identity" : "Set On-Chain Identity"}
          </h2>
          <p className="text-sm text-foreground-secondary mt-1">
            Set your on-chain identity for verification and display
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <div className="space-y-4">
        {/* Display Name (Required) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Display Name <span className="text-accent-red">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
            <input
              type="text"
              value={formData.display}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("display", e.target.value)}
              placeholder="Your display name"
              className={clsx("input w-full pl-10", errors.display && "border-accent-red")}
              maxLength={32}
            />
          </div>
          {errors.display && (
            <p className="text-xs text-accent-red mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.display}
            </p>
          )}
        </div>

        {/* Legal Name */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Legal Name
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
            <input
              type="text"
              value={formData.legal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("legal", e.target.value)}
              placeholder="Legal name (optional)"
              className="input w-full pl-10"
              maxLength={32}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
            <input
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
              placeholder="email@example.com"
              className={clsx("input w-full pl-10", errors.email && "border-accent-red")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-accent-red mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
            <input
              type="url"
              value={formData.web}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("web", e.target.value)}
              placeholder="https://example.com"
              className={clsx("input w-full pl-10", errors.web && "border-accent-red")}
            />
          </div>
          {errors.web && (
            <p className="text-xs text-accent-red mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.web}
            </p>
          )}
        </div>

        {/* Social Links */}
        <div className="grid grid-cols-2 gap-4">
          {/* Twitter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Twitter
            </label>
            <div className="relative">
              <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
              <input
                type="text"
                value={formData.twitter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("twitter", e.target.value)}
                placeholder="@username"
                className={clsx("input w-full pl-10", errors.twitter && "border-accent-red")}
              />
            </div>
            {errors.twitter && (
              <p className="text-xs text-accent-red mt-1">{errors.twitter}</p>
            )}
          </div>

          {/* GitHub */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              GitHub
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
              <input
                type="text"
                value={formData.github}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("github", e.target.value)}
                placeholder="username"
                className={clsx("input w-full pl-10", errors.github && "border-accent-red")}
              />
            </div>
            {errors.github && (
              <p className="text-xs text-accent-red mt-1">{errors.github}</p>
            )}
          </div>
        </div>

        {/* Matrix */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Matrix / Element
          </label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
            <input
              type="text"
              value={formData.matrix}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("matrix", e.target.value)}
              placeholder="@user:matrix.org"
              className={clsx("input w-full pl-10", errors.matrix && "border-accent-red")}
            />
          </div>
          {errors.matrix && (
            <p className="text-xs text-accent-red mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.matrix}
            </p>
          )}
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Profile Image URL
          </label>
          <div className="relative">
            <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-secondary" />
            <input
              type="url"
              value={formData.image}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("image", e.target.value)}
              placeholder="https://... or ipfs://..."
              className="input w-full pl-10"
            />
          </div>
        </div>
      </div>

      {/* Fee Info */}
      <div className="mt-6 p-4 bg-background-secondary rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground-secondary">Deposit Required:</span>
          <span className="text-foreground font-mono">
            {depositAmount || "~10 SEL"}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-foreground-secondary">Estimated Fee:</span>
          <span className="text-foreground font-mono">
            {estimatedFee || "~0.01 SEL"}
          </span>
        </div>
        <p className="text-xs text-foreground-secondary mt-2">
          The deposit will be returned when you clear your identity.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {hasExistingIdentity && (
          <button
            onClick={handleClear}
            disabled={isSubmitting}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <X className="h-4 w-4" />
            Clear Identity
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedSubstrateAccount}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {hasExistingIdentity ? "Update" : "Set"} Identity
        </button>
      </div>

      {!selectedSubstrateAccount && (
        <p className="text-xs text-center text-foreground-secondary mt-4">
          Please connect your Substrate wallet to set identity
        </p>
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function createIdentityInfo(formData: IdentityInfo): Record<string, unknown> {
  const encodeField = (value: string): unknown => {
    if (!value) return { None: null };
    return { Raw: value };
  };

  return {
    display: encodeField(formData.display),
    legal: encodeField(formData.legal),
    web: encodeField(formData.web),
    email: encodeField(formData.email),
    twitter: encodeField(formData.twitter),
    riot: encodeField(formData.matrix), // Matrix uses 'riot' field in Substrate
    image: encodeField(formData.image),
    pgpFingerprint: formData.pgpFingerprint ? formData.pgpFingerprint : null,
    additional: formData.github
      ? [[{ Raw: "github" }, { Raw: formData.github }]]
      : [],
  };
}

function formatBalance(balance: string): string {
  const value = BigInt(balance);
  const decimals = BigInt(18);
  const divisor = BigInt(10) ** decimals;
  const whole = value / divisor;
  const fraction = value % divisor;
  const fractionStr = fraction.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${fractionStr} SEL`;
}

export default IdentityForm;
