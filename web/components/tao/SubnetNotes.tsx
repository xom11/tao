"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function SubnetNotes({
  netuid,
  initialNotes,
}: {
  netuid: number;
  initialNotes: string | null;
}) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [draft, setDraft] = useState(initialNotes ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function handleEdit() {
    setDraft(notes);
    setEditing(true);
  }

  function handleCancel() {
    setDraft(notes);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.upsertMySubnet(netuid, { notes: draft });
      setNotes(draft);
      setEditing(false);
      toast.success("Notes saved");
      router.refresh();
    } catch (e) {
      toast.error("Save failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Notes</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted transition-colors"
            >
              {notes ? "Edit" : "Add note"}
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={12}
            placeholder="Write notes in Markdown..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Supports Markdown — headers, lists, code blocks, tables, checkboxes
          </p>
        </div>
      ) : notes ? (
        <div className="rounded-md border bg-card px-5 py-4 prose prose-sm dark:prose-invert max-w-none
          prose-headings:font-semibold prose-headings:text-foreground
          prose-p:text-foreground prose-p:leading-relaxed
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-muted prose-pre:border prose-pre:rounded-md
          prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
          prose-hr:border-border
          prose-th:text-foreground prose-td:text-foreground
          prose-li:text-foreground prose-li:marker:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {notes}
          </ReactMarkdown>
        </div>
      ) : (
        <div
          onClick={handleEdit}
          className="rounded-md border border-dashed bg-muted/20 px-5 py-8 text-center cursor-pointer hover:bg-muted/40 transition-colors"
        >
          <p className="text-sm text-muted-foreground">No notes yet. Click to add.</p>
        </div>
      )}
    </div>
  );
}
