"use client";

import { useEffect, useMemo, useState } from "react";
import { MapCrosshairPicker } from "@/components/wizard/MapCrosshairPicker";
import Dropdown, { type DropdownOption } from "@/components/ui/Dropdown";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type SiteType = { code: number; label: string };
type Site = {
  id?: string;
  name: string;
  type: string | number;
  depthM: number;
  areaM2: number;
  coords?: [number, number];
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Site;
  walletAddress?: string; // required for create
  onClose: () => void;
  onSaved: (site: Site & { id: string }) => void;
};

export function SiteModal({ open, mode, initial, walletAddress, onClose, onSaved }: Props) {
  const [types, setTypes] = useState<SiteType[]>([]);
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState<string | number>(initial?.type || "");
  const [depthM, setDepthM] = useState<number | ''>(initial?.depthM ?? '');
  const [areaM2, setAreaM2] = useState<number | ''>(initial?.areaM2 ?? '');
  const [coords, setCoords] = useState<[number, number] | undefined>(initial?.coords);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const r = await fetch("/api/site-types");
      const j = await r.json().catch(() => ({}));
      setTypes(Array.isArray(j.items) ? j.items : []);
    })();
  }, [open]);

  const valid = useMemo(() => {
    const hasBasic = name.trim().length > 0 && String(type).length > 0;
    if (mode === "create") return hasBasic && !!coords; // depth/area optional
    return hasBasic; // edit: coords read-only
  }, [name, type, coords, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setSaving(true);
    try {
      if (mode === "create") {
        if (!walletAddress || !coords) throw new Error("Missing wallet or coordinates");
        const res = await fetch("/api/sites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet_address: walletAddress,
            name: name.trim(),
            type,
            depth_m: depthM === '' ? null : Number(depthM),
            area_m2: areaM2 === '' ? null : Number(areaM2),
            location: coords,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Create failed (${res.status})`);
        onSaved({ id: json.id, name: json.name, type: json.type, depthM: json.depthM, areaM2: json.areaM2, coords: json.coords });
        onClose();
      } else {
        const res = await fetch(`/api/sites/${initial?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            type,
            depth_m: depthM === '' ? null : Number(depthM),
            area_m2: areaM2 === '' ? null : Number(areaM2),
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `Update failed (${res.status})`);
        onSaved({ id: initial!.id!, name: name.trim(), type, depthM: depthM === '' ? null as any : Number(depthM), areaM2: areaM2 === '' ? null as any : Number(areaM2), coords: initial?.coords });
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-[760px] max-w-[95vw] rounded-[28px] bg-vulcan-900 outline outline-1 outline-vulcan-200 p-6 md:p-8 text-white"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-black">{mode === "create" ? "Add a new site" : "Edit site"}</h2>
            <p className="text-white/70">Click the location on the map to claim your regen site</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full h-10 w-10 grid place-items-center hover:bg-white/10 outline outline-1 outline-white/20">✕</button>
        </div>

        {mode === "create" && (
          <div className="mb-5">
            <MapCrosshairPicker initial={coords} onPick={setCoords} />
          </div>
        )}
        {mode === "edit" && initial?.coords && (
          <div className="mb-5">
            <MapCrosshairPicker initial={initial.coords} interactive={false} zoom={18} showPick={false} />
            <div className="mt-2 text-white/70 text-sm">Location is fixed and cannot be changed.</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <label className="grid gap-2">
            <span className="text-base text-white/70">Name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name here" />
          </label>
          <label className="grid gap-2">
            <span className="text-base text-white/70">Select the type of this site, this would help you build up the public profile</span>
            <Dropdown
              options={(types || []).map((t) => ({ label: t.label, value: t.label } as DropdownOption))}
              value={type as any}
              onChange={(val) => setType(val)}
              placeholder="Select site type"
            />
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="grid gap-2">
              <span className="text-base text-white/70">How deep is this site in meter</span>
              <Input type="number" min={0} step="0.1" value={depthM as any} onChange={(e) => setDepthM(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter the depth" />
            </label>
            <label className="grid gap-2">
              <span className="text-base text-white/70">The surface area in meter</span>
              <Input type="number" min={0} step="0.1" value={areaM2 as any} onChange={(e) => setAreaM2(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Enter the surface area" />
            </label>
          </div>
        </div>

        <div className="mt-6">
          <Button type="submit" disabled={!valid || saving} size="lg" fullWidth>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
