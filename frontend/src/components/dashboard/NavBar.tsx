import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/creators", label: "Discover" },
  { to: "/campaigns", label: "Campaigns" },
  { to: "/shortlists", label: "Shortlists" },
];

export function NavBar() {
  return (
    <nav className="flex items-center gap-6 border-b border-gray-200 px-6 py-4">
      <span className="font-semibold text-gray-900">Creator Hunter</span>
      <div className="flex gap-4 text-sm">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? "font-medium text-indigo-600" : "text-gray-600 hover:text-gray-900"
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
