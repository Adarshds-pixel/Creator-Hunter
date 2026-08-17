import { useEffect, useState, type FormEvent } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import {
  fetchShortlists,
  createShortlist,
  removeCreatorFromShortlist,
  fetchCreator,
} from "../../lib/apiClient";
import type { Shortlist } from "../../types/shortlist";
import type { Creator } from "../../types/creator";

// Member C — Campaigns & Outreach
export default function Shortlists() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [creatorsById, setCreatorsById] = useState<Record<string, Creator>>({});
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const data = await fetchShortlists();
      setShortlists(data);

      const ids = Array.from(new Set(data.flatMap((s) => s.creators.map((c) => c.creatorId))));
      const missing = ids.filter((id) => !creatorsById[id]);
      if (missing.length > 0) {
        const fetched = await Promise.all(missing.map((id) => fetchCreator(id).catch(() => null)));
        setCreatorsById((prev) => {
          const next = { ...prev };
          fetched.forEach((creator, i) => {
            if (creator) next[missing[i]] = creator;
          });
          return next;
        });
      }
    } catch {
      setError("Could not load shortlists.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    await createShortlist(newName.trim());
    setNewName("");
    await load();
  }

  async function handleRemove(shortlistId: string, creatorId: string) {
    await removeCreatorFromShortlist(shortlistId, creatorId);
    await load();
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-semibold text-gray-900">Shortlists</h1>

      <Card>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New shortlist name"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <Button type="submit">Create</Button>
        </form>
      </Card>

      {loading && <p className="text-sm text-gray-500">Loading shortlists...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && shortlists.length === 0 && !error && (
        <Card>
          <p className="text-sm text-gray-500">
            No shortlists yet. Create one above, or add creators from Discover.
          </p>
        </Card>
      )}

      {shortlists.map((shortlist) => (
        <Card key={shortlist._id} className="space-y-2">
          <p className="font-semibold text-gray-900">{shortlist.name}</p>
          {shortlist.creators.length === 0 && (
            <p className="text-sm text-gray-500">No creators in this shortlist yet.</p>
          )}
          <div className="space-y-1">
            {shortlist.creators.map((sc) => (
              <div
                key={sc.creatorId}
                className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
              >
                <span>{creatorsById[sc.creatorId]?.name ?? sc.creatorId}</span>
                <Button
                  variant="outline"
                  className="text-xs"
                  onClick={() => handleRemove(shortlist._id, sc.creatorId)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
