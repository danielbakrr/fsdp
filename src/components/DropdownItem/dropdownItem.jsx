import "./dropdownItem.css"
import React from "react"
// pass props from the parent component, destructure the children prop and onCLick
const DropdownItem = ({children,onClick}) => {
    return (
        <div className= "dropdown-item" onClick = {onClick}>
            {children}
        </div>
    )
}

export default DropdownItem;