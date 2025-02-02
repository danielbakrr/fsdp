// Method to verify JWT and extract payload info 
const jwt = require('jsonwebtoken');
require('dotenv').config();
function verifyJWT(req,res,next){
    // Extract headers from incoming request 
    const token = req.headers.authorization && req.headers.authorization.split(" ")[1];
    console.log(JSON.stringify(token,null,2));
    if(!token){
        return res.status(401).json({message: "Unauthorised"});
    }
    // Verify the jwt token signature using the private key (secret key)
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
        
        if (err){
            return res.status(403).json({message: "Forbidden", "error": err});
        }

        // Standardising the CRUD operations to actions 
        // view (GET) -> view
        // uplaod (POST) -> create 
        // update (PUT) -> update 
        // delete (DELETE) -> delete 

        // List of authorizedRoutes for each user
        const authorizedRoutes = {
            "/api/get-advertisments" : {"action": "view", "resource": "Advertisements"},
            "/api/upload-advertisement/[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$": {"action": "create", "resource": "Advertisements"},
            "/api/edit-userRole/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$": {"action" : "update", "resource" : "User"},
            "/api/get-allUsers" : {"action": "view", "resource": "User"},
            "/api/delete-user/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$" : {"action": "delete", "resource": "User"},
            // Routes for TvGroup
            "/tvgroups" : {"action": "create", "resource": "TvGroup"},
            "/tvgroups/grp\d{6}$:" : {"action": "view", "resource": "TvGroup"}, // Get all tvGroups 
            "/tvgroups/grp\d{6}$" : {"action": "delete", "resource": "TvGroup"}, // Delete tvGroup 
            "/tvgroups" : {"action" : "view", "resource": "TvGroup"},
            "/tvgroups/grp\d{6}$" : {"action" : "view", "resource": "TvGroup"},

            // Thinking whether it needs to be deleted 
            "/tvgroups/:groupID/tvs": {"action": "view", "resource": "Tv"},
            "/tvgroups/:groupID/tvs/tv\d{6}$": {"action" : "delete"},
            "/tvgroups/:groupID/tvs/batch-delete": {"action" : "delete", "resource": "Tv"},
            "/tvgroups/:groupID/tvs/batch-update": {"action": "update", "resource": "Tv"},

            // Advertisements 
            "/advertisements" : {"action" : "view", "resource": "Advertisement"}, // Retrieve all advertisements 
            "/api/delete/\d{13}$" : {"action" : "delete", "resource": "Advertisment"}, // Delete ads by ad id 
            "/advertisements/\d{13}$" : {"action": "view", "resource": "Advertisement"},
            "/api/update-ad" : {"action": "edit", "resource": "Advertisement"},
            "/advertisements/:adID/\d{13}$" : {"action": "view", "resource": "Advertisement"},
            // Template editor routes 
            "/api/update-coordinates": {"action": "update", "resource": "Template"}
            
        }

        console.log(decoded);
        const url = new URL(requestedEndpoint);
        const path = url.pathname; // Extracts '/get-Advertisments'
        console.log(path);

        // check regex endpoint and the permissions with the other object
        const authorizedRole = Object.entries(authorizedRoutes).find(
            ([endpoint,rolePerm]) =>{
                const regex = new RegExp(`^${endpoint}$`);
                console.log(`Checking requested endpoint: ${path}`);
                console.log(`Regex: ${regex}`);
                console.log(`Regex Test Result ${regex.test(path)}`);
                const matchedPermission = checkPermissions(rolePerm,decoded.permissions.permissions);
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
