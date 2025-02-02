import React, { useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from 'framer-motion';
import logo from "../assets/githubbies-logo2.png";
import "../styles/Home.css";
import "../styles/SplashScreen.css";
import Navbar from './navbar';

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
              position: 'absolute',
              top: positionFromTop,
              transform: `translateY(-50%)`
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="logo-wrapper"
            >
              <img 
                src={logo} 
                alt="Dinosaur" 
                className="dino-logo shake"
              />
            </motion.div>
            
            <motion.div
              className="loading-dots"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0
                }}
                className="dot"
              />
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.2
                }}
                className="dot"
              />
              <motion.span
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.4
                }}
                className="dot"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Home = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [role,setRole] = useState("");
  const [userFeatures,setUserFeatures] = useState([]);
  
  const features = ["Tv Groups", "Template Editor", "Advertisement Management", "User Management", "Metrics", "Schedule Ads"];
  let roleName = "";
  const decodeToken = ()=> {
    const token = localStorage.getItem('token');
    if(token != null){
      const decodedToken = jwtDecode(token);
      console.log(JSON.stringify(decodedToken,null,2));
      const role = decodedToken.permissions;
      const temp = [];
      const permissions = role.permissions;
      setRole(role.roleName);
      if(Array.isArray(permissions) && permissions.length > 0){
        permissions.forEach(element => {
          console.log(element.resource);
          for(let i = 0; i< features.length; i++){
            if(features[i].includes(element.resource)){
              temp.push(features[i]);
            }
          }
        });
      }
      setUserFeatures(temp);
    }
  }

  useEffect(()=>{
    decodeToken();
    console.log(roleName);
  },[])
  
  if (userFeatures === undefined){
    return (
      <div className= "loading">
        still loading
      </div>
    )
  }

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
        <div className="dashboard-sections">
          {userFeatures.map((feature, index) => {
            const content = (() => {
              switch (feature) {
                case "Advertisement Management":
                  return {
                    title: feature,
                    description: "Edit uploaded advertisements created during template creation",
                    link: "/template-management",
                    buttonText: "Manage Advertisements"
                  };
                case "Tv Groups":
                  return {
                    title: feature,
                    description: "Manage tvGroups through tvGroup creation, deletion and update. Distribute selected advertisements to respective tvs in tvGroups",
                    link: "/advertisement-display",
                    buttonText: "Display Advertisements"
                  };
                case "Template Editor":
                  return {
                    title: feature,
                    description: "Design and create ad templates for advertisement.",
                    link: "/template-editor",
                    buttonText: "Create Templates"
                  };
                case "User Management":
                  return {
                    title: feature,
                    description: "Create new roles with user defined permissions, manage user roles and delete users",
                    link: "/manage-users",
                    buttonText: "Manage users"
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
      </div>
    </motion.div>
  );
};

export default Home;