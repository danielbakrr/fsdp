import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/githubbies-logo.jpg"; // Replace with your actual logo path
import "../styles/navbar.css";


const Navbar = ({navItems}) => {

  const logoutUser= ()=>{
    localStorage.clear();
  }
  console.log(navItems);
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
          {navItems.map((child)=>{
            switch(child){
              case "Template Editor":

                return (
                  <li>
                    <Link to="/template-editor">Template Editor</Link>
                  </li>
                )

              case "Advertisement Management":
                return (
                  <li>
                    <Link to="/template-management">Advertisement Management</Link>
                  </li>
                )
              
              case "Tv Group":
              return (
                  <li>
                    <Link to = "/advertisement-display">Tv Groups</Link>
                  </li>
              )
              
              case "User Management":
                return (
                  <li>
                    <Link to = "/manage-users"> Manage Users</Link>
                  </li>
                )
              
            }
          })}
          <li>
            <Link to = "/" onClick={logoutUser}>Log out</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
  
};

export default Navbar;
