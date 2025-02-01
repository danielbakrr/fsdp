// Set up for the manageUsers page 
import React, { useState, useEffect} from "react";
import "../../styles/displayUsers.css"
import Select from 'react-select';
import { MdDelete } from "react-icons/md";
import Navbar from "../navbar";
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import Dropdown from "../Dropdown/dropdown";
import DropdownItem from "../DropdownItem/dropdownItem"
import { ToastContainer, toast } from 'react-toastify';

const DisplayUsers = () => {
    let navigate = useNavigate();
    const [users,setUsers] = useState([]);
    const [isModalOpen,setModalOpen] = useState(false);
    const [adPermissions,setAdPermissions] = useState([]);
    const [userPermissions,setUserPermissions] = useState([]);
    const [templatePermissions,setTemplatePermissions] = useState([]);
    const [tvGroupPermissions,setTvGroupPermissions] = useState([]);
    const [metricsPermissions, setMetricsPermissions] = useState([]);
    const [schedulingPermissions,setSchedulingPermissions] = useState([]);
    const [tvGroupIds,setTvGroupIds] = useState([]);
    const [selectedTvIds,setSelectedIds] = useState([]);
    const [roleName,setRoleName] = useState("");
    const [newRole,selectRole] = useState({});
    const [roles,setRoles] = useState([]);
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
    const token = localStorage.getItem('token');
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

    const retrieveAllTvGroups = async()=> {
        const response = await fetch('/api/tvGroups');
        if (response.status == 200){
            toast.success("Retrieved all tvGroups sucessfully");
            const data = await response.json();
            const tvGroupOptions = [];
            data.map((tvObj)=> {
                const opt = {
                    "value": tvObj.groupID,
                    "label": tvObj.groupName
                }
                tvGroupOptions.push(opt);
            })
            setTvGroupIds(tvGroupOptions);
        }
        else{
            toast.error("Unable to retrieve all tv Groups");
        }
    }

    const editRole = async (userId,newRole)=> {
        const response = await fetch(`/api/edit-userRole/${userId}`,{
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`, 
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
                setUsers(prevUsers => prevUsers.filter(user => user.userId !== userId));
                const message = await response.json();
                toast.success(message);
                
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
            if (response.status == 200){

                const roles = await response.json();
                setRoles(roles.roles);
            }
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

        if(schedulingPermissions.length > 0){
            const tempObject = {
                "actions": schedulingPermissions.map(schedulePerm => schedulePerm.value),
                "resource": "Schedule Ads"
            }
            newPermissions.push(tempObject)
        }

        
        if(tvGroupPermissions.length > 0){
            if (selectedTvIds.length > 0){
                const tvIds = selectedTvIds.map(selectedTvIds => selectedTvIds.value);
                const tempObject = {
                    "actions": tvGroupPermissions.map(tvGrpPerm => tvGrpPerm.value),
                    "resource": "Tv Group",
                    "tvGroupId": tvIds
                }

                newPermissions.push(tempObject)
            }
            else {
                const tempObject = {
                    "actions": tvGroupPermissions.map(tvGrpPerm => tvGrpPerm.value),
                    "resource": "Tv Group",
                }
                newPermissions.push(tempObject)
            }
        }

        if(metricsPermissions.length > 0){
            const tempObject = {
                 "actions": metricsPermissions.map(metPerm => metPerm.value),
                "resource": "Metrics"
            }

            newPermissions.push(tempObject);
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

        if (response.status == 201){
            toast.success("Sucessfully created user role");
        }
        else if (response.status == 403){
            toast.warn("User is forbidden from creating user roles");
        }
        else {
            toast.error("Unable to create user roles");
        }

        
    }
    // fetch the data in the useEffect (When component is rendered first time i fetch the data, subsequent re renders no need to fetch )
    useEffect(()=>{
        decodeToken();
        // call our fetch api method that sets the data 
        fetchUsers();
        // call fetch api to set the roles 
        fetchAllRoles();

        retrieveAllTvGroups();
    },[])

    const openAddRoleModal = () => {
        setModalOpen(true);
    }

    const closeAddRoleModal = () => {
        setModalOpen(false);
    }
    const fetchUsers = async ()=> {
        try{
            const response = await fetch("/api/get-allUsers",{
                'headers':{
                    "Authorization": `Bearer ${token}`,
                    'content-type': "application/json",
                }
            });
            if (response.status == 200){
                const users = await response.json();
                if (users.retrievedUsers != null){
                    setUsers(users.retrievedUsers); // Creates a new array
                    toast.success("Users retrieved sucessfully");
                }
            }
            else if (response.status == 403){
                toast.warn("User is forbidden from accessing this feature")
                setTimeout(()=>{
                    navigate('/Home')
                },5000)
            }
            else {
                toast.error("Unable to retrieve users")
            }
        }
        catch(err){
            console.error(err);
        }
       
    }

    // return the react component 
    return (
        <div className = "usersTableContainer">
            <ToastContainer>
            </ToastContainer>
            <Navbar
                navItems={userFeatures}/>
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
                        <th>userName</th>
                        <th>email</th>
                        <th>role</th>
                        <th>Actions</th>
                    </tr>
                    <tbody>
                    {users.map((user) => (
                        <tr key={user.userId}>
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
                        <button className="close-modal-btn-user" onClick={(e) => closeAddRoleModal()}>
                                Close
                        </button>
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
                            <h4>User permissions</h4>
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

                        <div className = "permissions">
                            <h4>Tv Group Permissions</h4>
                            <Select
                                isMulti
                                name="names"
                                options={options}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                styles={customStyles}
                                onChange={setTvGroupPermissions}
                            />
                        </div>

                        <div className = "permissions">
                            <h4>Select Tv Groups</h4>
                            <Select
                                isMulti
                                name="names"
                                options={tvGroupIds}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                styles={customStyles}
                                onChange={setSelectedIds}
                            />
                        </div>

                        <div className = "permissions">
                            <h4>Scheduling Permissions</h4>
                            <Select
                                isMulti
                                name="names"
                                options={options}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                styles={customStyles}
                                onChange={setSchedulingPermissions}
                            />
                        </div>

                        <div className = "permissions">
                            <h4>Metrics</h4>
                            <Select
                                isMulti
                                name="names"
                                options={options}
                                className="basic-multi-select"
                                classNamePrefix="select"
                                styles={customStyles}
                                onChange={setMetricsPermissions}
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