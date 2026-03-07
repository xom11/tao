"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { MySubnet } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function f4(v: number | null) {
  return v == null ? "—" : v.toFixed(4);
}

// ── Form dialog (add / edit) ──────────────────────────────────────────────────

interface FormDialogProps {
  open: boolean;
  onClose: () => void;
  initial?: MySubnet;
}

function FormDialog({ open, onClose, initial }: FormDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [netuid, setNetuid] = useState(initial?.netuid?.toString() ?? "");
  const [coldkey, setColdkey] = useState(initial?.coldkey ?? "");
  const [hotkey, setHotkey] = useState(initial?.hotkey ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const isEdit = !!initial;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nid = parseInt(netuid, 10);
    if (isNaN(nid) || nid < 0) { setError("NetUID must be a non-negative number"); return; }
    setError("");
    startTransition(async () => {
      await api.upsertMySubnet(nid, {
        coldkey: coldkey.trim() || undefined,
        hotkey: hotkey.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Subnet #${initial.netuid}` : "Add Subnet"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your participation info for this subnet."
              : "Track a subnet you're participating in as validator or miner."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="netuid">NetUID *</Label>
            <Input
              id="netuid"
              placeholder="e.g. 18"
              value={netuid}
              onChange={(e) => setNetuid(e.target.value)}
              disabled={isEdit}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coldkey">Coldkey</Label>
            <Input
              id="coldkey"
              placeholder="5ABC..."
              value={coldkey}
              onChange={(e) => setColdkey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hotkey">Hotkey</Label>
            <Input
              id="hotkey"
              placeholder="5DEF..."
              value={hotkey}
              onChange={(e) => setHotkey(e.target.value)}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="validator SN18, commission 10%, ..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save Changes" : "Add Subnet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete confirm dialog ────────────────────────────────────────────────────

interface DeleteDialogProps {
  subnet: MySubnet | null;
  onClose: () => void;
}

function DeleteDialog({ subnet, onClose }: DeleteDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!subnet) return;
    startTransition(async () => {
      await api.deleteMySubnet(subnet.netuid);
      router.refresh();
      onClose();
    });
  }

  return (
    <Dialog open={!!subnet} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Remove Subnet #{subnet?.netuid}?</DialogTitle>
          <DialogDescription>
            This removes it from your watch list. Collected data is kept.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Subnet card ──────────────────────────────────────────────────────────────

interface CardProps {
  subnet: MySubnet;
  onEdit: () => void;
  onDelete: () => void;
}

function SubnetCard({ subnet: s, onEdit, onDelete }: CardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg font-bold">SN{s.netuid}</span>
          {s.active != null && (
            <Badge variant={s.active ? "secondary" : "outline"}>
              {s.active ? "active" : "inactive"}
            </Badge>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="text-destructive hover:text-destructive">
            Remove
          </Button>
        </div>
      </div>

      {/* Keys */}
      <div className="grid grid-cols-1 gap-1 text-sm">
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Coldkey</span>
          <span className="font-mono text-xs break-all">{s.coldkey ?? "—"}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-muted-foreground w-16 shrink-0">Hotkey</span>
          <span className="font-mono text-xs break-all">{s.hotkey ?? "—"}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-1 border-t">
        <div>
          <p className="text-xs text-muted-foreground">Stake</p>
          <p className="font-mono text-sm font-medium">{f4(s.stake_tao)} τ</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Incentive</p>
          <p className="font-mono text-sm font-medium">{f4(s.incentive)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Emission/tempo</p>
          <p className="font-mono text-sm font-medium">{f4(s.emission_tao)} τ</p>
        </div>
      </div>

      {/* Notes */}
      {s.notes && (
        <p className="text-xs text-muted-foreground border-t pt-2 whitespace-pre-line line-clamp-3">
          {s.notes}
        </p>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function MySubnetsManager({ subnets }: { subnets: MySubnet[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MySubnet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MySubnet | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Subnets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Subnets you&apos;re participating in as validator or miner
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>+ Add Subnet</Button>
      </div>

      {/* Empty state */}
      {subnets.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-muted-foreground text-sm">No subnets configured yet.</p>
          <Button className="mt-4" onClick={() => setAddOpen(true)}>Add your first subnet</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subnets.map((s) => (
            <SubnetCard
              key={s.netuid}
              subnet={s}
              onEdit={() => setEditTarget(s)}
              onDelete={() => setDeleteTarget(s)}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <FormDialog open={addOpen} onClose={() => setAddOpen(false)} />
      <FormDialog
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        initial={editTarget ?? undefined}
      />
      <DeleteDialog subnet={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </div>
  );
}
