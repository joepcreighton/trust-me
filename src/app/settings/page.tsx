"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useSettings, Settings } from "@/lib/settings-context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// ─── primitives ───────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="text-[11px] font-bold text-muted uppercase tracking-widest px-5 pt-5 pb-2">
      {label}
    </p>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="mx-4 bg-white rounded-2xl shadow-sm shadow-black/5 overflow-hidden divide-y divide-black/5">
      {children}
    </div>
  );
}

// Row with a toggle on the right
function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-charcoal">{label}</p>
        {description && (
          <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
          checked ? "bg-sage" : "bg-black/15"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

// Row with a segmented control below the label
function SegmentRow<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="px-5 py-4">
      <p className="text-sm font-medium text-charcoal">{label}</p>
      {description && (
        <p className="text-xs text-muted mt-0.5 mb-2.5 leading-relaxed">{description}</p>
      )}
      {!description && <div className="mt-2.5" />}
      <div className="flex bg-black/6 rounded-xl p-0.5 gap-0.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 text-xs font-semibold py-1.5 px-1 rounded-[10px] transition-all leading-tight",
              value === opt.value
                ? "bg-white text-charcoal shadow-sm"
                : "text-muted hover:text-charcoal/70"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Plain button row (for Account actions)
function ActionRow({
  label,
  onClick,
  destructive,
}: {
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-black/4 transition-colors group"
    >
      <span className={cn("text-sm font-medium", destructive ? "text-rose-500" : "text-charcoal")}>
        {label}
      </span>
      <ChevronRight
        size={16}
        className="text-muted/40 transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { settings, updateSetting } = useSettings();

  function set<K extends keyof Settings>(key: K) {
    return (value: Settings[K]) => updateSetting(key, value);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/sign-in");
  }

  return (
    <div className="pb-8">
      {/* Sub-header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-black/5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors px-2 py-1.5 rounded-lg"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="font-semibold text-charcoal text-base absolute left-1/2 -translate-x-1/2">
          Settings
        </h1>
      </div>

      {/* ── Privacy ──────────────────────────────────────────────────────── */}
      <SectionHeader label="Privacy" />
      <Card>
        <SegmentRow
          label="Profile visibility"
          value={settings.profileVisibility}
          options={[
            { label: "Public", value: "public" },
            { label: "Friends only", value: "friends" },
          ]}
          onChange={set("profileVisibility")}
        />
        <SegmentRow
          label="Who can see my saved recs"
          value={settings.savedRecsVisibility}
          options={[
            { label: "Everyone", value: "everyone" },
            { label: "Friends", value: "friends" },
            { label: "Only me", value: "only-me" },
          ]}
          onChange={set("savedRecsVisibility")}
        />
        <SegmentRow
          label="Who can see my asks"
          value={settings.asksVisibility}
          options={[
            { label: "Friends", value: "friends" },
            { label: "Anyone", value: "anyone" },
          ]}
          onChange={set("asksVisibility")}
        />
        <ToggleRow
          label="Show my city on my profile"
          checked={settings.showCity}
          onChange={set("showCity")}
        />
        <ToggleRow
          label="Friends of friends can see my recs"
          description="Expands your reach to the extended network."
          checked={settings.allowFofRecs}
          onChange={set("allowFofRecs")}
        />
      </Card>

      {/* ── Notifications ────────────────────────────────────────────────── */}
      <SectionHeader label="Notifications" />
      <Card>
        <ToggleRow
          label="Friend vouches for my rec"
          checked={settings.notifyFriendVouches}
          onChange={set("notifyFriendVouches")}
        />
        <ToggleRow
          label="Someone replies to my ask"
          checked={settings.notifyAskReplies}
          onChange={set("notifyAskReplies")}
        />
        <ToggleRow
          label="My rec joins a Trusted Chain"
          description="When 3+ people vouch in a chain involving your rec."
          checked={settings.notifyTrustedChain}
          onChange={set("notifyTrustedChain")}
        />
        <ToggleRow
          label="A friend joins Trust Me"
          checked={settings.notifyFriendJoins}
          onChange={set("notifyFriendJoins")}
        />
      </Card>

      {/* ── Account ──────────────────────────────────────────────────────── */}
      <SectionHeader label="Account" />
      <Card>
        <ActionRow label="Manage friends" onClick={() => router.push("/profile/friends")} />
        <ActionRow label="Log out" destructive onClick={handleSignOut} />
      </Card>
    </div>
  );
}
