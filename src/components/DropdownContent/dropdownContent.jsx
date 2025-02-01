import React from "react"
import "./dropdownContent.css"
const DropDownContent = ({children,open}) => {
    return (
    <div className = {`dropdown-content ${open ? "content-open" : null}`}>
        {open ? children : null} 
        {/* conditionally render the child prop based on open */}
    </div>)
};

export default DropDownContent;