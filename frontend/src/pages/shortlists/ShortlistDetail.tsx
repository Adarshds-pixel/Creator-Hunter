import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CreatorCard } from "../../components/creators/CreatorCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { fetchShortlists, fetchCreator, removeCreatorFromShortlist } from "../../lib/apiClient";
import type { Shortlist } from "../../types/shortlist";
import type { Creator } from "../../types/creator";

// Member C — Campaigns & Outreach
export default function ShortlistDetail() {
  const { id } = useParams<{ id: string }>();
  const [shortlist, setShortlist] = useState<Shortlist | null>(null);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const all = await fetchShortlists();
      const found = all.find((s) => s._id === id) ?? null;
      setShortlist(found);
      if (found) {
        const fetched = await Promise.all(
          found.creators.map((c) => fetchCreator(c.creatorId).catch(() => null))
        );
        setCreators(fetched.filter((c): c is Creator => !!c));
      } else {
        setCreators([]);
      }
    } catch {
      setError("Could not load this shortlist.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRemove(creatorId: string) {
    if (!id) return;
    await removeCreatorFromShortlist(id, creatorId);
    setCreators((prev) => prev.filter((c) => c._id !== creatorId));
  }

  return (
    <div className="space-y-6 py-6">
      <Link to="/shortlists" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:underline">
        <ArrowLeft size={14} /> Back to Shortlists
      </Link>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      )}

      {!loading && error && <p className="text-sm text-caution">{error}</p>}

      {!loading && !error && !shortlist && (
        <EmptyState title="Shortlist not found" description="It may have been deleted." />
      )}

      {!loading && shortlist && (
        <>
          <div>
            <h1 className="text-2xl font-semibold text-ink">{shortlist.name}</h1>
            <p className="text-sm text-ink-secondary">
              {creators.length} creator{creators.length === 1 ? "" : "s"}
            </p>
          </div>

          {creators.length === 0 ? (
            <EmptyState
              title="No creators in this shortlist yet"
              description="Add creators from Discover to build this list out."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 min-[1600px]:grid-cols-4">
              {creators.map((creator) => (
                <div key={creator._id} className="flex flex-col gap-2">
                  <CreatorCard creator={creator} />
                  <button
                    type="button"
                    onClick={() => handleRemove(creator._id)}
                    className="self-start text-xs font-medium text-caution hover:underline"
                  >
                    Remove from shortlist
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
