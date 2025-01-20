// Set up for the manageUsers page 
import React, { useState, useEffect} from "react";
import "../styles/displayUsers.css"
import { MdDelete } from "react-icons/md";
import { IoAddCircleOutline } from "react-icons/io5";
import Navbar from "./navbar";
import Dropdown from "./Dropdown/dropdown";
import DropdownItem from "./DropdownItem/dropdownItem"

const DisplayUsers = () => {
    const [users,setUsers] = useState([]);
    const [isModalOpen,setModalOpen] = useState(false);
    const [roles,setRoles] = useState([]);
    // fetch the data in the useEffect (When component is rendered first time i fetch the data, subsequent re renders no need to fetch )
    useEffect(()=>{
        setRoles(["jeff","john","joseph"]);
        // call our fetch api method that sets the data 
        fetchUsers();
    },[])

    const fetchUsers = async ()=> {
        try{
            const response = await fetch("/api/get-allUsers");
            const users = await response.json();
            console.log(users);
            if (users.retrievedUsers != null){
                setUsers(users.retrievedUsers);
            }
            else {
                console.log("Error fetching users");
            }
        }
        catch(err){
            console.error(err);
        }
       
    }

    // return the react component 
    return (
        <div className = "usersTableContainer">
            <Navbar/>
            {/* the rest of the html elements */}
            <div className = "userTable">
                <h2>Users table</h2>
                <div className = "createnew-role-container">
                    <button className = "create-new-role-btn">
                        Add role
                    </button>
                </div>
                <table className = "styledUserTable">
                    <tr>
                        <th>userId</th>
                        <th>userName</th>
                        <th>email</th>
                        <th>role</th>
                        <th>Actions</th>
                    </tr>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.userId}>
                            <td>{user.userId}</td>
                            <td>{user.userName}</td>
                            <td>{user.email}</td>
                            <td>
                                <Dropdown
                                    buttonText= "Admin"
                                    content={
                                        <>
                                        {roles.map((role, id) => (
                                            <DropdownItem key={id}>{`Item ${role}`}</DropdownItem>
                                        ))}
                                        </>
                                    }
                                />
                            </td>
                            <td>
                               {/* A delete icon to put */}
                               <div className = "delete-btn">
                                    <MdDelete/>
                                    <span>Delete user</span>
                               </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DisplayUsers;