import React from "react"
import DropdownButton from "../DropdownButton/dropdownButton"
import { useState } from "react"
import DropDownContent from "../DropdownContent/dropdownContent"

// pass the props to child component from parent component 
const Dropdown = ({buttonText, content,id}) => {
    const [open,setOpen] = useState(false);
    // set the open to true (dropdown is toggled open )
    const toggleDropDown = ()=> {
        setOpen((open) => !open) // set to true 
    }
    return (
        <div className = "dropdown-isaac">
           <DropdownButton toggle = {toggleDropDown} open = {open}>
                {buttonText}
           </DropdownButton>
           <DropDownContent open = {open}>{content}</DropDownContent>
        </div>
    )
}

export default Dropdown;