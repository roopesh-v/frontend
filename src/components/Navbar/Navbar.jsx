import { NavLink } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <header className="appNavbar">
      <div className="appNavbar__inner">
        <div className="appNavbar__brand">Company</div>

        <nav className="appNavbar__links" aria-label="Primary">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "appNavbar__link is-active" : "appNavbar__link"
            }
          >
            Employees
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "appNavbar__link is-active" : "appNavbar__link"
            }
          >
            Dashboard
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
