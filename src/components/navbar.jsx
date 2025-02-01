import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/githubbies-logo.jpg"; // Replace with your actual logo path
import "../styles/navbar.css";

const Navbar = () => {
  return (
    <div className="Navbar">
      <nav className="navbar">
        <div className="navbar-logo">
          <Link to="/Home">
            <img src={logo} alt="Logo" />
          </Link>
        </div>
        <ul className="navbar-links">
          <li>
            <Link to="/Home">Dashboard</Link>
          </li>
          <li>
            <Link to="/template-management">File Management</Link>
          </li>
          <li>
            <Link to="/template-editor">Template Editor</Link>
          </li>
          <li>
            <Link to="/advertisement-display">Advertisement Display</Link> {/* New link */}
          </li>
          <li>
            <Link to="/manage-users">Manage Users</Link> {/* New link */}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
