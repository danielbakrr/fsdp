import React from "react";
import Navbar from './navbar';
import { Link } from "react-router-dom";
import {useState} from "react";
import { jwtDecode } from 'jwt-decode';
import template1 from "../assets/Burger Food Super Deal Restaurant Advertising Poster.jpg";
import template2 from "../assets/Happy Hour Beer Instagram Story.mp4";
import template3 from "../assets/Pink and Peach Photo Food Bread Ads Instagram Story.png";
import template4 from "../assets/Warm Colors Elegant Eau de Parfum Instagram Story .png";
import template5 from "../assets/Orange Retro Nostalgia Food and Beverage Poster.png";
import template6 from "../assets/Black and Red Simple Glitch Black Friday Sale Mobile Video.mp4";
import template7 from "../assets/Beige Black Minimalist Ice Cream Promotion Poster.png";
import "../styles/ViewAllTemplates.css"; // Custom CSS for this page

const ViewAllTemplates = () => {
  const templates = [
    {
      id: 1,
      type: "image",
      src: template1,
      alt: "Template 1",
      link: "https://www.canva.com/design/DAGWWmZ0Rtw/fLLIYdTSnnNYM2EeS_drZQ/edit?utm_content=DAGWWmZ0Rtw&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 2,
      type: "video",
      src: template2,
      alt: "Template 2",
      link: "https://www.canva.com/design/DAGWWsBqmCs/Mbq2eFTNSMWYggeHXvcLZA/edit?utm_content=DAGWWsBqmCs&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 3,
      type: "image",
      src: template3,
      alt: "Template 3",
      link: "https://www.canva.com/design/DAGWXAte7Jc/2QtZqFoyg4kZZXWITKCI2Q/edit?utm_content=DAGWXAte7Jc&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 4,
      type: "image",
      src: template4,
      alt: "Template 4",
      link: "https://www.canva.com/design/DAGWXJO93N0/59tJ-AEdyzNbYrLWb2SGFw/edit?utm_content=DAGWXJO93N0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 5,
      type: "image",
      src: template5,
      alt: "Template 5",
      link: "https://www.canva.com/design/DAGWXDDjJy8/s_vntK7RCdcMBI66v9FClg/edit?utm_content=DAGWXDDjJy8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 6,
      type: "video",
      src: template6,
      alt: "Template 6",
      link: "https://www.canva.com/design/DAGWXLMVXtM/y23m30MOetxFvbCd3fHNXA/edit?utm_content=DAGWXLMVXtM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 7,
      type: "image",
      src: template7,
      alt: "Template 7",
      link: "https://www.canva.com/design/DAGWXGGji-M/y-J26LFu2OwkWut4MSz4lA/edit?utm_content=DAGWXGGji-M&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
  ];

  const [userFeatures,setUserFeatures] = useState([]);
  const features = ["Tv Groups", "Template Editor", "Advertisement Management", "User Management", "Metrics", "Schedule Ads"];
  
  const decodeToken = ()=> {
        const token = localStorage.getItem('token');
        if(token != null){
          const decodedToken = jwtDecode(token);
          console.log(JSON.stringify(decodedToken,null,2));
          const role = decodedToken.permissions;
          const temp = [];
          const permissions = role.permissions;
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

  return (
    <div className="view-all-templates">
      <Navbar
        navItems={userFeatures}
      />
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> &gt; <Link to="/manage-templates">Templates</Link> &gt; View All Templates
      </div>

      <p>Pre-built Templates</p>

      {/* List all templates */}
      <div className="template-list">
        {templates.map((template, index) => (
          <div key={index} className="template-item">
            <h2>{`Template ${template.id}`}</h2>
            <a href={template.link} target="_blank" rel="noopener noreferrer">
              {template.type === "image" ? (
                <img src={template.src} alt={template.alt} />
              ) : (
                <video width="300" controls>
                  <source src={template.src} alt={template.alt} />
                </video>
              )}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViewAllTemplates;
