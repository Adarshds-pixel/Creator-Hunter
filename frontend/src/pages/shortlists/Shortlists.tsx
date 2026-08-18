import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Star, Search, Clock, Calendar, LayoutGrid, List, ChevronDown, MoreVertical, Download } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Modal } from "../../components/ui/Modal";
import { DropdownMenu } from "../../components/ui/DropdownMenu";
import { EmptyState } from "../../components/ui/EmptyState";
import { Skeleton } from "../../components/ui/Skeleton";
import { IconTile } from "../../components/dashboard/IconTile";
import { MemberAvatars } from "../../components/shortlists/MemberAvatars";
import { fetchShortlists, createShortlist, deleteShortlist, fetchCreator, exportToCSV } from "../../lib/apiClient";
import { formatShortDate, formatRelativeTime } from "../../lib/format";
import type { Shortlist } from "../../types/shortlist";
import type { Creator } from "../../types/creator";

const SORT_OPTIONS = [
  { key: "recent", label: "Recently updated" },
  { key: "name", label: "Name" },
  { key: "creators", label: "Most creators" },
] as const;

export default function Shortlists() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [creatorsById, setCreatorsById] = useState<Record<string, Creator>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<(typeof SORT_OPTIONS)[number]["key"]>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchShortlists();
      setShortlists(data);

      const ids = Array.from(new Set(data.flatMap((s) => s.creators.map((c) => c.creatorId))));
      const fetched = await Promise.all(ids.map((cid) => fetchCreator(cid).catch(() => null)));
      const map: Record<string, Creator> = {};
      fetched.forEach((creator, i) => {
        if (creator) map[ids[i]] = creator;
      });
      setCreatorsById(map);
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
    setCreating(true);
    try {
      await createShortlist(newName.trim());
      setNewName("");
      setCreateOpen(false);
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this shortlist? This can't be undone.")) return;
    await deleteShortlist(id);
    await load();
  }

  const filteredSorted = useMemo(() => {
    const filtered = shortlists.filter((s) => s.name.toLowerCase().includes(search.trim().toLowerCase()));
    const copy = [...filtered];
    if (sortKey === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
    if (sortKey === "creators") copy.sort((a, b) => b.creators.length - a.creators.length);
    if (sortKey === "recent")
      copy.sort(
        (a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime()
      );
    return copy;
  }, [shortlists, search, sortKey]);

  function handleExport(shortlist: Shortlist) {
    const rows = shortlist.creators.map((sc) => {
      const creator = creatorsById[sc.creatorId];
      return {
        Name: creator?.name || sc.creatorId,
        Username: creator?.username || "",
        Platform: creator?.platform || "",
        Category: creator?.category || "",
        Followers: creator?.followers || 0,
        EngagementRate: `${creator?.engagementRate || 0}%`,
        AuthenticityScore: creator?.authenticityScore || 0,
        EstimatedCost: creator?.estimatedCost || 0,
        Location: creator?.location || "",
        Notes: sc.notes || "",
      };
    });
    exportToCSV(shortlist.name.replace(/\s+/g, "_"), rows);
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Shortlists</h1>
          <p className="text-sm text-ink-secondary">Organize and manage your shortlisted creators.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-control bg-gradient-to-r from-indigo to-blue px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          + Create New Shortlist
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-steel-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search shortlists..."
            className="w-full rounded-control border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-secondary focus:border-teal focus:outline-none"
          />
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink hover:bg-steel-100"
            >
              {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
              <ChevronDown size={14} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenu.Item key={opt.key} onSelect={() => setSortKey(opt.key)}>
                {opt.label}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        <div className="flex overflow-hidden rounded-control border border-border">
          <button
            type="button"
            aria-label="Grid view"
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-teal-soft text-teal" : "text-steel-500 hover:bg-steel-100"}`}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => setViewMode("list")}
            className={`p-2 ${viewMode === "list" ? "bg-teal-soft text-teal" : "text-steel-500 hover:bg-steel-100"}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-caution">{error}</p>}

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-steel-500">My Shortlists</h2>

        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {!loading && filteredSorted.length === 0 && !error && (
          <EmptyState
            title="No shortlists yet"
            description="Create one above, or add creators from Discover."
          />
        )}

        {!loading && filteredSorted.length > 0 && (
          <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
            {filteredSorted.map((shortlist) => {
              const members = shortlist.creators
                .map((c) => creatorsById[c.creatorId])
                .filter((c): c is Creator => !!c)
                .map((c) => ({ name: c.name, photo: c.profileImage }));
              return (
                <Card key={shortlist._id} className="flex items-center gap-4">
                  <IconTile icon={Star} color="amber" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{shortlist.name}</p>
                    <p className="text-xs text-ink-secondary">
                      {shortlist.creators.length} Creator{shortlist.creators.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="hidden shrink-0 sm:block">
                    <MemberAvatars members={members} />
                  </div>
                  <div className="hidden shrink-0 flex-col gap-0.5 text-xs text-ink-secondary md:flex">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={12} /> Created {formatShortDate(shortlist.createdAt ?? new Date().toISOString())}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} /> Updated {formatRelativeTime(shortlist.updatedAt ?? shortlist.createdAt ?? new Date().toISOString())}
                    </span>
                  </div>
                  <Link
                    to={`/shortlists/${shortlist._id}`}
                    className="shrink-0 rounded-control border border-teal px-3 py-1.5 text-xs font-medium text-teal hover:bg-teal-soft"
                  >
                    View
                  </Link>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button type="button" aria-label="Shortlist options" className="shrink-0 text-steel-500 hover:text-ink">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item asChild>
                        <Link to={`/shortlists/${shortlist._id}`}>View</Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item onSelect={() => handleExport(shortlist)} className="inline-flex w-full items-center gap-2">
                        <Download size={14} /> Export to CSV
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item onSelect={() => handleDelete(shortlist._id)} className="text-danger">
                        Delete shortlist
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={createOpen} onOpenChange={setCreateOpen} title="Create New Shortlist">
        <form onSubmit={handleCreate} className="space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Shortlist name"
            autoFocus
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-teal focus:outline-none"
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="inline-flex items-center gap-1.5 rounded-control bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal/90 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
