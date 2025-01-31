// Home.jsx 
import React, { useEffect, useState} from "react";
import { Link } from "react-router-dom";
// import the jwt decoded function (decode token on frontend)
import { jwtDecode } from "jwt-decode";
import "../styles/Home.css";
import Navbar from './navbar';  

const Home = () => {
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
  else{
    return (
    
      <div className="dashboard">
          <Navbar navItems={userFeatures} />
        <div className="dashboard-content">
          <h1 className="dashboard-title"> Welcome {role} 😊</h1>
          <div className="dashboard-sections">
            {userFeatures.map((feature)=> {
              switch (feature){
                case "Advertisement Management": 
                  // JSX for the advertisement tab
                  return(
                    <div className="dashboard-section">
                      <h2>{feature}</h2>
                      <p>
                        Edit uploaded advertisements created during template creation
                      </p>
                      <Link to="/template-management">
                        <button className="dashboard-btn">Manage Advertisements</button>
                      </Link>
                    </div>
                  )
                case "Tv Groups": 
                  // JSX for the advertisement tab
                  return(
                    <div className="dashboard-section">
                      <h2>{feature}</h2>
                      <p>
                        Manage tvGroups through tvGroup creation, deletion and update. Distribute selected advertisements to 
                        respective tvs in tvGroups
                      </p>
                      <Link to="/advertisement-display">
                        <button className="dashboard-btn">Display Advertisements</button>
                      </Link>
                    </div>
                  )
                
                case "Template Editor":
                  // JSX for the template management tab 
                  return (
                    <div className="dashboard-section">
                      <h2>{feature}</h2>
                      <p>Design and create ad templates for advertisement.</p>
                      <Link to="/template-editor">
                        <button className="dashboard-btn">Create Templates</button>
                      </Link>
                    </div>
                  )
                
                case "User Management": 
                  // JSX for the user management tab 
                  return (
                    <div className= "dashboard-section">
                      <h2>{feature}</h2>
                      <p>Create new roles with user defined permissions, manage user roles and delete users</p>
                      <Link to = "/manage-users">
                        <button className="dashboard-btn">Manage users</button>
                      </Link>
                    </div>
                  )
              }
            })}
          </div>
        </div>
      </div>
    );
  }
  
};

     
export default Home;
