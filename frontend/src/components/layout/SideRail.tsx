import { NavLink } from "react-router-dom";
import { DashboardIcon, DiscoverIcon, CampaignsIcon, ShortlistsIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { UserChip } from "./UserChip";
import { CoverageStat } from "../dashboard/CoverageStat";
import { useCoverageStat } from "../../lib/useCoverageStat";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { to: "/creators", label: "Discover", icon: DiscoverIcon },
  { to: "/campaigns", label: "Campaigns", icon: CampaignsIcon },
  { to: "/shortlists", label: "Shortlists", icon: ShortlistsIcon },
];

// Desktop rail below 640px becomes a fixed bottom tab bar instead of
// reflowing — icon+label down to 1280px, icon-only below that, tab bar
// below 640px. Two separate <nav> renders (only one visible per breakpoint
// via CSS), not one element trying to be both shapes.
export function SideRail() {
  const coverage = useCoverageStat();

  return (
    <>
      <nav
        aria-label="Primary"
        className="hidden w-16 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border bg-sidebar px-2 py-6 sm:flex xl:w-56"
      >
        <span className="mb-4 hidden px-2 font-data text-xs font-semibold uppercase tracking-wide text-steel-500 xl:block">
          Creator Hunter
        </span>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-control border-l-2 px-3 py-3 text-sm font-medium transition-colors ${
                isActive ? "border-teal bg-teal-soft text-teal" : "border-transparent text-steel-700 hover:bg-steel-100"
              }`
            }
          >
            <Icon />
            <span className="hidden xl:inline">{label}</span>
          </NavLink>
        ))}
        <div className="flex-1" />
        {coverage && (
          <div className="hidden xl:block">
            <CoverageStat creators={coverage.creators} cities={coverage.cities} categories={coverage.categories} />
          </div>
        )}
        <ThemeToggle />
        <UserChip />
      </nav>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border bg-sidebar py-1.5 sm:hidden"
      >
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium ${
                isActive ? "text-teal" : "text-steel-500"
              }`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
