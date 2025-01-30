// Set up for the manageUsers page 
import React, { useState, useEffect} from "react";
import "../../styles/displayUsers.css"
import Select from 'react-select';
import { MdDelete } from "react-icons/md";
import Navbar from "../navbar";
import Dropdown from "../Dropdown/dropdown";
import DropdownItem from "../DropdownItem/dropdownItem"

const DisplayUsers = () => {
    const [users,setUsers] = useState([]);
    const [isModalOpen,setModalOpen] = useState(false);
    const [adPermissions,setAdPermissions] = useState([]);
    const [userPermissions,setUserPermissions] = useState([]);
    const [templatePermissions,setTemplatePermissions] = useState([]);
    const [roleName,setRoleName] = useState("");
    const [newRole,selectRole] = useState({});
    const [roles,setRoles] = useState([]);
    // Custom styles for react-select
    const customStyles = {
        control: (provided) => ({
        ...provided,
        borderColor: "#ccc", // Default border color
        }),
        multiValue: (provided) => ({
        ...provided,
        backgroundColor: "#add8e6", // Background color of selected items
        }),
        multiValueLabel: (provided) => ({
        ...provided,
        color: "black", // Change the label color (text) of selected items
        }),
        multiValueRemove: (provided) => ({
        ...provided,
        color: "#d64137", // Color of the remove icon
        }),
    };

    const handleSelectedRole = (dropdownId,role,oldRole) => {
        selectRole((prevRoles)=> ({
            ...prevRoles,
            [dropdownId]:role
        }))
        if (role != oldRole){
            console.log(role);
            editRole(dropdownId,role);
        }
        else {
            alert("New role selected is the same")
        }
    }

    const editRole = async (userId,newRole)=> {
        const response = await fetch(`/api/edit-userRole/${userId}`,{
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify({
                role: newRole
            })
        });
        if (response.status == 200){
            alert("User role has been sucessfully updated");

        }
        else {
            alert("Internal server error");
        }
    }
    const handleAdPermissions = (selected)=> {
        setAdPermissions(selected); // Set selected items in the array
    }    

    const handleUserPermissions = (selected)=> {
        setUserPermissions(selected); // Set selected items in the array
    }   

    const handleTemplatePermissions = (selected)=> {
        setTemplatePermissions(selected); // Set selected items in the array
    }

    const options = [
        {value: 'create', label:'create'},
        { value: 'view', label: 'view' },
        { value: 'update', label: 'update' },
        { value: 'delete', label: 'delete' },
    ]


    const deleteUser = async(userId)=> {
        try{
            const response = await fetch(`/api/delete-user/${userId}`,{
                'method':'DELETE',
                'headers':{
                    'content-type': 'application/json'
                }
            });
            if(response.status == 200){
                const message = await response.json();
                console.log(message);
                alert(message)
            }
            else{
                alert("Unable to delete user");
            }
        }
        catch(err){
            console.error(err);
        }
    }
    const fetchAllRoles = async()=>{
        try {
            const response = await fetch("/api/getAllRoles");
            const roles = await response.json();
            setRoles(roles.roles);
        }
        catch (err){
            console.error(err);
        }
    }
    const createNewRole = async ()=> {
        const newPermissions = [];
        if (adPermissions.length > 0){
            const adObject = {
                "actions" : adPermissions.map(adPerm => adPerm.value),
                "resource" : "Advertisement"
            }
            newPermissions.push(adObject)
        }

        if (userPermissions.length > 0){
            const userObject = {
                "actions" : userPermissions.map(usePerm => usePerm.value),
                "resource" : "User"
            }
            newPermissions.push(userObject)
        }

        if (templatePermissions.length > 0){
            const tempObject = {
                "actions" : templatePermissions.map(tempPerm => tempPerm.value),
                "resource" : "Template"
            }
            newPermissions.push(tempObject)
        }

        console.log(JSON.stringify(newPermissions,null,2));

        const request = {
            roleName: roleName,
            permissions: newPermissions
        }

        console.log(request);

        const response = await fetch('/api/create-userRole',{
            'method': 'POST',
            'headers': {
                'content-type': 'application/json',
            },
            'body': JSON.stringify(request)
        })

        if (response.status == 200){
            // alert the user of sucessful role creation 
            alert(`The role ${roleName} has been created sucessfully`);

        }
        else {
            alert("Internal server error");
        }

        
    }
    // fetch the data in the useEffect (When component is rendered first time i fetch the data, subsequent re renders no need to fetch )
    useEffect(()=>{
        // call our fetch api method that sets the data 
        fetchUsers();
        // call fetch api to set the roles 
        fetchAllRoles();
    },[])

    const openAddRoleModal = () => {
        setModalOpen(true);
    }

    const closeAddRoleModal = () => {
        setModalOpen(false);
    }
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
                    <button className = "create-new-role-btn" onClick = {openAddRoleModal}>
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
                                    id = {user.userId}
                                    buttonText={newRole[user.userId] || user.role} // Show selected role for each dropdown
                                    content={
                                        <>
                                        {roles.map((role, id) => (
                                            <DropdownItem key={id} onClick={() => handleSelectedRole(user.userId,role,user.role)}>{role}
                                                
                                            </DropdownItem>
                                        ))}
                                        </>
                                    }
                                    
                                />
                            </td>
                            <td>
                               {/* A delete icon to put */}
                               <div className = "delete-btn" onClick = {(e)=> deleteUser(user.userId)}>
                                    <MdDelete/>
                                    <span>Delete user</span>
                               </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Div for modal input in the  */}
            {isModalOpen && (
                <div className = "add-roleModal">
                    {/* modal content for displaying */}
                    <div className = "add-roleModalContent">
                        <div className = "close-btn">
                            <button onClick={closeAddRoleModal}>
                                Close
                            </button>
                        </div>
                        <div className = "role-name-edit">
                            <label>Role Name:</label>
                            <input type = "text" value={roleName} onChange={(e) => setRoleName(e.target.value)}></input>
                        </div>
                        {/* This is where we import our multi select for the role thing */}
                        <div className = "permissions">
                            <h4>Advertisement permissions</h4>
                            <Select
                                isMulti
                                name="names"
                                options={options}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                styles={customStyles}
                                onChange = {handleAdPermissions}
                            />
                        </div>

                        <div className = "permissions">
                            <h4>Users permissions</h4>
                            <Select
                                isMulti
                                name="names"
                                options={options}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                styles={customStyles}
                                onChange={setUserPermissions}
                            />
                        </div>

                        <div className = "permissions">
                            <h4>Template permissions</h4>
                            <Select
                                isMulti
                                name="names"
                                options={options}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                styles={customStyles}
                                onChange={setTemplatePermissions}
                            />
                        </div>
                        <button className = "submit-btn" onClick = {(e) => createNewRole()}>
                            Submit
                        </button>
                    </div>
                </div>
            )}
        </div>

        
    )
    
    
}

export default DisplayUsers;