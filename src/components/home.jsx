import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import logo from "../assets/githubbies-logo2.png";
import "../styles/Home.css";
import "../styles/SplashScreen.css";
import Navbar from "./navbar";

const SplashScreen = ({ onAnimationComplete, positionFromTop = "55%" }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(onAnimationComplete, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="splash-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="logo-container"
            style={{
              position: "absolute",
              top: positionFromTop,
              transform: `translateY(-50%)`,
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="logo-wrapper"
            >
              <img src={logo} alt="Dinosaur" className="dino-logo shake" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Home = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState("");
  const [userFeatures, setUserFeatures] = useState([]);
  const [metrics, setMetrics] = useState([]); 

  const features = ["Tv Groups", "Template Editor", "Advertisement Management", "User Management", "Metrics", "Schedule Ads"];

  const decodeToken = () => {
    const token = localStorage.getItem("token");
    if (token != null) {
      const decodedToken = jwtDecode(token);
      const role = decodedToken.permissions;
      const temp = [];
      const permissions = role.permissions;
      setRole(role.roleName);
      if (Array.isArray(permissions) && permissions.length > 0) {
        permissions.forEach((element) => {
          for (let i = 0; i < features.length; i++) {
            if (features[i].includes(element.resource)) {
              temp.push(features[i]);
            }
          }
        });
      }
      setUserFeatures(temp);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch("https://githubbiesbackend.onrender.com/api/get-metrics");
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  useEffect(() => {
    decodeToken();
    fetchMetrics();
  }, []);

  if (showSplash) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar navItems={userFeatures} />
      <div className="dashboard-content">
        <motion.h1
          className="dashboard-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Welcome {role} 😊
        </motion.h1>

        {/* Existing Dashboard Sections */}
        <div className="dashboard-sections">
          {userFeatures.map((feature, index) => {
            const content = (() => {
              switch (feature) {
                case "Advertisement Management":
                  return {
                    title: feature,
                    description: "Edit uploaded advertisements created during template creation",
                    link: "/template-management",
                    buttonText: "Manage Advertisements",
                  };
                case "Tv Groups":
                  return {
                    title: feature,
                    description:
                      "Manage tvGroups through tvGroup creation, deletion and update. Distribute selected advertisements to respective tvs in tvGroups",
                    link: "/advertisement-display",
                    buttonText: "Display Advertisements",
                  };
                case "Template Editor":
                  return {
                    title: feature,
                    description: "Design and create ad templates for advertisement.",
                    link: "/template-editor",
                    buttonText: "Create Templates",
                  };
                case "User Management":
                  return {
                    title: feature,
                    description: "Create new roles with user-defined permissions, manage user roles and delete users",
                    link: "/manage-users",
                    buttonText: "Manage users",
                  };
                default:
                  return null;
              }
            })();

            if (!content) return null;

            return (
              <motion.div
                className="dashboard-section"
                key={feature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
              >
                <h2>{content.title}</h2>
                <p>{content.description}</p>
                <Link to={content.link}>
                  <button className="dashboard-btn">{content.buttonText}</button>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Metrics Section*/}
        <div className="metrics-section">
          <h2>Advertisement Metrics</h2>
          <div className="metrics-container">
            {metrics.map((ad) => (
              <div className="metric-card" key={ad.adID}>
                <h3>{ad.adName}</h3>
                <div className="chart-container">
                  <Bar
                    data={{
                      labels: ["Likes"],
                      datasets: [
                        {
                          label: "Likes",
                          data: [ad.likes],
                          backgroundColor: "rgba(173, 86, 207, 0.5)",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          min: 0,
                          max: 50,
                          ticks: {
                            stepSize: 10,
                          },
                        },
                      },
                      plugins: {
                        legend: { display: false },
                      },
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Home;
