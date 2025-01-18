// Method to verify JWT and extract payload info 
const jwt = require('jsonwebtoken');
const { Role } = require('../models/role');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET_KEY;
function verifyJWT(req,res,next){
    // Extract headers from incoming request 
    const token = req.headers.authorization && req.headers.authorization && req.headers.authorization.split(" ")[1];
    console.log(JSON.stringify(token,null,2));
    if(!token){
        return res.status(401).json({message: "Forbidden"});
    }
    // Verify the jwt token signature using the private key (secret key)
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
        if (err){
            return res.status(403).json({message: "Forbidden"});
        }

        // Standardising the CRUD operations to actions 
        // view (GET) -> view
        // uplaod (POST) -> create 
        // update (PUT) -> update 
        // delete (DELETE) -> delete 

        // List of authorizedRoutes for each user
        const authorizedRoutes = {
            "/get-advertisments" : {"action": "view", "resource": "Advertisements"},
            "/upload-advertisement/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i": {"action": "create", "resource": "Advertisements"},
            "/update-userRole": {"action": "update", "resource":"User"},
            "/update-campaigns": {"action": "update", "resource": "Campaigns"},
            "/view-campaigns": {"action": "view", "resource": "Campaigns"}
        }
        // match the permissions of each use to a route in authroized role  
        const requestedEndpoint = req.url;
        const url = new URL(requestedEndpoint);
        const path = url.pathname; // Extracts '/get-Advertisments'

        // check regex endpoint and the permissions with the other object
        const authorizedRole = Object.entries(authorizedRoutes).find(
            ([endpoint,rolePerm]) =>{
                const regex = new RegExp(`^${endpoint}$`);
                console.log(`Checking requested endpoint: ${path}`);
                console.log(`Regex: ${regex}`);
                console.log(`Regex Test Result ${regex.test(path)}`);
                const matchedPermission = checkPermissions(rolePerm,decoded.permissions);
                return regex.test(path) && matchedPermission === true; 
            }
        )
        
        if (!authorizedRole){
            return res.status(403).json({"message": "Forbidden"});
        }

        // attatched decoded info to user 
        req.user = decoded
        next();
    })
   
    
}

function checkPermissions(rolePerm,permissions){
    console.log(JSON.stringify(rolePerm,null,2));
    console.log(JSON.stringify(permissions,null,2));
    const result =  permissions.some((perm) => {
        // console.log(JSON.stringify(perm,null,2));
        // chceck if both perm.role and rolePerm.role is same and rolePerm.actions and perm.actions is not null\
        if ((perm.resource === rolePerm.resource)){
            const permActions = perm.actions;
            console.log(JSON.stringify(permActions,null,2));
            // console.log(JSON.stringify(permActions,null,2));
            if(permActions && rolePerm.action != null){
                if (Array.isArray(permActions)){
                    return permActions.includes(rolePerm.action)
                }
                else {
                    return false;
                }
            }
            else{
                return false
            }

        }
        else {
            return false
        }
    })
    console.log(result);
    return result;
}

module.exports = {
    checkPermissions,
    verifyJWT
}
