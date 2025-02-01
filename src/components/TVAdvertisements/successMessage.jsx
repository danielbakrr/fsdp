import React from "react";
import "../../styles/alertMessage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
  faCircleInfo,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const AlertMessage = ({ type, message, onClose }) => {
  const icons = {
    Success: faCircleCheck,
    Error: faCircleExclamation,
    Warning: faTriangleExclamation,
    Info: faCircleInfo,
  };

  return (
    <div className="notification-box">
      <div className={`notification ${type}`}>
        <div className="icon">
          <FontAwesomeIcon icon={icons[type]} />
        </div>
        <div className="title">
          <h1>{type}</h1>
          <h6>{message}</h6>
        </div>
        <div className="close" onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} />
        </div>
      </div>
    </div>
  );
};

export default AlertMessage;
