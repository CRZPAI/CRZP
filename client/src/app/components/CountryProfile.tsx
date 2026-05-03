import React from "react";
import { Users, Globe, MapPin, Building2, Languages, Coins } from "lucide-react";
import { type CountryProfile } from "@shared/schema";

interface Props { profile: CountryProfile }

function formatNumber(n?: number) {
  if (!n) return "Unknown";
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || "Unknown"}</span>
    </div>
  );
}

export function CountryProfile({ profile }: Props) {
  return (
    <div className="border border-border rounded-xl p-5 bg-card flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {profile.flag && (
          <img
            src={profile.flag}
            alt={`Flag of ${profile.name}`}
            className="h-8 rounded border border-border object-cover"
          />
        )}
        <div>
          <h3 className="text-base font-semibold">{profile.name}</h3>
          {profile.subregion && (
            <p className="text-xs text-muted-foreground">{profile.subregion}, {profile.region}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div>
        <Row icon={Users}     label="Population" value={formatNumber(profile.population)} />
        <Row icon={Building2} label="Capital"    value={profile.capital || "Unknown"} />
        <Row icon={Globe}     label="Region"     value={profile.region || "Unknown"} />
        <Row icon={MapPin}    label="Area"       value={profile.area ? `${formatNumber(profile.area)} km²` : "Unknown"} />
        {(profile.languages?.length ?? 0) > 0 && (
          <Row icon={Languages} label="Languages" value={profile.languages!.slice(0, 2).join(", ")} />
        )}
        {(profile.currencies?.length ?? 0) > 0 && (
          <Row icon={Coins} label="Currency" value={profile.currencies!.slice(0, 2).join(", ")} />
        )}
      </div>
    </div>
  );
}
