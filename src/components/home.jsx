// Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import Navbar from './navbar';

const Home = () => {
  return (
    <div className="dashboard">
      <Navbar />
      <div className="dashboard-content">
        <h1 className="dashboard-title">Welcome Admin! 😊</h1>

        <div className="dashboard-sections">
          <div className="dashboard-section">
            <h2>Advertisement Management</h2>
            <p>
              Set up and control ad campaigns, including scheduling and content
              selection.
            </p>
            <Link to="/file-management">
              <button className="dashboard-btn">Manage Advertisements</button>
            </Link>
          </div>

          <div className="dashboard-section">
            <h2>Ad Template Management</h2>
            <p>Design and create ad templates for advertisement.</p>
            <Link to="/manage-templates">
              <button className="dashboard-btn">Create Templates</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

     
export default Home;
