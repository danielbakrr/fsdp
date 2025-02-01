import React, { useEffect, useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import { jwtDecode } from 'jwt-decode';

import template1 from "../assets/Burger Food Super Deal Restaurant Advertising Poster.jpg";
import template2 from "../assets/Happy Hour Beer Instagram Story.mp4";
import template3 from "../assets/Pink and Peach Photo Food Bread Ads Instagram Story.png";
import template4 from "../assets/Warm Colors Elegant Eau de Parfum Instagram Story .png";
import template5 from "../assets/Orange Retro Nostalgia Food and Beverage Poster.png";
import template6 from "../assets/Black and Red Simple Glitch Black Friday Sale Mobile Video.mp4";
import template7 from "../assets/Beige Black Minimalist Ice Cream Promotion Poster.png";
import "../styles/Template.css";
import Navbar from "./navbar";

const TemplatePage = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/template-editor");
  };
  const [active, setActive] = useState(0); // State to track the active template
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
  const templates = [
    {
      id: 1,
      type: "image",
      src: template1,
      alt: "template 1",
      link: "https://www.canva.com/design/DAGWWmZ0Rtw/fLLIYdTSnnNYM2EeS_drZQ/edit?utm_content=DAGWWmZ0Rtw&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 2,
      type: "video",
      src: template2,
      alt: "template 2",
      link: "https://www.canva.com/design/DAGWWsBqmCs/Mbq2eFTNSMWYggeHXvcLZA/edit?utm_content=DAGWWsBqmCs&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 3,
      type: "image",
      src: template3,
      alt: "template 3",
      link: "https://www.canva.com/design/DAGWXAte7Jc/2QtZqFoyg4kZZXWITKCI2Q/edit?utm_content=DAGWXAte7Jc&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 4,
      type: "image",
      src: template4,
      alt: "template 4",
      link: "https://www.canva.com/design/DAGWXJO93N0/59tJ-AEdyzNbYrLWb2SGFw/edit?utm_content=DAGWXJO93N0&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 5,
      type: "image",
      src: template5,
      alt: "template 5",
      link: "https://www.canva.com/design/DAGWXDDjJy8/s_vntK7RCdcMBI66v9FClg/edit?utm_content=DAGWXDDjJy8&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 6,
      type: "video",
      src: template6,
      alt: "template 6",
      link: "https://www.canva.com/design/DAGWXLMVXtM/y23m30MOetxFvbCd3fHNXA/edit?utm_content=DAGWXLMVXtM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
    {
      id: 7,
      type: "image",
      src: template7,
      alt: "template 7",
      link: "https://www.canva.com/design/DAGWXGGji-M/y-J26LFu2OwkWut4MSz4lA/edit?utm_content=DAGWXGGji-M&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton",
    },
  ];

  useEffect(() => {
    let items = document.querySelectorAll(".slider .item");
    let next = document.getElementById("next");
    let prev = document.getElementById("prev");
    function loadShow() {
      if (items.length === 0 || !items[active]) {
        console.error("No items found or active index is out of bounds");
        return;
      }

      let stt = 0;
      items[active].style.transform = `none`;
      items[active].style.zIndex = 1;
      items[active].style.filter = "none";
      items[active].style.opacity = 1;

      for (let i = active + 1; i < items.length; i++) {
        stt++;
        items[i].style.transform = `translateX(${120 * stt}px) scale(${
          1 - 0.2 * stt
        }) perspective(16px) rotateY(-1deg)`;
        items[i].style.zIndex = -stt;
        items[i].style.filter = "blur(2px)";
        items[i].style.opacity = stt > 2 ? 0 : 0.7;
      }

      stt = 0;
      for (let i = active - 1; i >= 0; i--) {
        stt++;
        items[i].style.transform = `translateX(${-120 * stt}px) scale(${
          1 - 0.2 * stt
        }) perspective(16px) rotateY(-1deg)`;
        items[i].style.zIndex = -stt;
        items[i].style.filter = "blur(2px)";
        items[i].style.opacity = stt > 2 ? 0 : 0.7;
      }
    }

    loadShow();

    next.onclick = function () {
      setActive((prev) => (prev + 1) % items.length);
    };

    prev.onclick = function () {
      setActive((prev) => (prev - 1 + items.length) % items.length);
      loadShow();
    };
  }, [active]);

  return (
    <div className="template-page">
      <Navbar
        navItems={userFeatures} 
      />
      <div className="breadcrumb">
        <Link to = "/" className="breakcrumb-link">Home</Link> &gt;
        <span> Templates</span>
      </div>

      <div className="templates-header">
        <div className="text">Recommended Templates</div>
      </div>    

      <div className="slider">
        {templates.map((template, index) => (
          <div key={index} className="item">
            <h1>{`Template ${template.id}`}</h1>
            {template.type === "image" ? (
              <a href={template.link} target="_blank" rel="noopener noreferrer">
                <img src={template.src} alt={template.alt} />
              </a>
            ) : (
              <a href={template.link} target="_blank" rel="noopener noreferrer">
                <video controls>
                  <source src={template.src} alt={template.alt} />
                </video>
              </a>
            )}
          </div>
        ))}
        <button id="next">{">"}</button>
        <button id="prev">{"<"}</button>
      </div>

      <div className="button-container">
          <button className="view-all-button">
            <Link to="/manage-templates/view-all">View All Templates</Link>
          </button>
          <button className="create-new-button" onClick={handleClick}>
            Create New Template
          </button>
        </div>
    </div>
  );
};

export default TemplatePage;
