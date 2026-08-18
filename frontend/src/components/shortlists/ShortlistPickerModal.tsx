import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Skeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { fetchShortlists, createShortlist, addCreatorToShortlist } from "../../lib/apiClient";
import type { Shortlist } from "../../types/shortlist";

interface ShortlistPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName?: string;
  onAdded?: (shortlistId: string) => void;
}

// Lets a user pick which shortlist to add a creator to (or create one on
// the spot) — previously every "Add to shortlist" click silently landed in
// whichever shortlist happened to be first, with no way to choose.
// Mirrors CreatorProfile.tsx's existing "Add to campaign" picker modal.
export function ShortlistPickerModal({ open, onOpenChange, creatorId, creatorName, onAdded }: ShortlistPickerModalProps) {
  const [shortlists, setShortlists] = useState<Shortlist[] | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setShortlists(null);
    setAddedId(null);
    setError(null);
    fetchShortlists()
      .then(setShortlists)
      .catch(() => setError("Could not load your shortlists."));
  }, [open]);

  async function handleAdd(shortlistId: string) {
    setAddingId(shortlistId);
    setError(null);
    try {
      await addCreatorToShortlist(shortlistId, creatorId);
      setAddedId(shortlistId);
      onAdded?.(shortlistId);
    } catch {
      setError("Could not add to that shortlist.");
    } finally {
      setAddingId(null);
    }
  }

  async function handleCreateAndAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const shortlist = await createShortlist(newName.trim());
      setShortlists((prev) => [...(prev ?? []), shortlist]);
      setNewName("");
      await handleAdd(shortlist._id);
    } catch {
      setError("Could not create that shortlist.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add to shortlist"
      description={creatorName ? `Choose a shortlist for ${creatorName}.` : undefined}
    >
      {shortlists === null && (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      )}

      {shortlists?.length === 0 && <EmptyState title="No shortlists yet" description="Create one below to get started." />}

      {shortlists && shortlists.length > 0 && (
        <ul className="space-y-2">
          {shortlists.map((shortlist) => (
            <li key={shortlist._id}>
              <button
                type="button"
                onClick={() => handleAdd(shortlist._id)}
                disabled={addingId === shortlist._id || addedId === shortlist._id}
                className="flex w-full items-center justify-between rounded-control border-[0.5px] border-border px-3 py-2 text-left text-sm hover:bg-steel-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-ink">{shortlist.name}</span>
                <span className="text-xs text-steel-500">
                  {addedId === shortlist._id
                    ? "Added"
                    : addingId === shortlist._id
                      ? "Adding…"
                      : `${shortlist.creators.length} creator${shortlist.creators.length === 1 ? "" : "s"}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-3 text-xs text-caution">{error}</p>}

      <form onSubmit={handleCreateAndAdd} className="mt-4 flex gap-2 border-t-[0.5px] border-border pt-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New shortlist name"
          className="flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-secondary focus:border-teal focus:outline-none"
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="rounded-control bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal/90 disabled:opacity-50"
        >
          {creating ? "Creating…" : "Create & add"}
        </button>
      </form>
    </Modal>
  );
}
