// Method to verify JWT and extract payload info 
const {jwt} = require('jsonwebtoken');
require('dotenv').config();
const secretKey = process.env.JWT_SECRET_KEY;
function verifyJWT(req,res,next){
    // Extract headers from incoming request 
    const token = req.headers.authorization && req.headers.authorization && req.headers.headers.authorization.split(" ")[1];
    if(!token){
        return res.status(401).json({token:token});
    }
    // Verify the jwt token signature using the private key (secret key)
    jwt.verify(token,process.env.JWT_SECRET_KEY,(err,decoded)=>{
        if (err){
            return res.status(403).json({message: "Forbidden"});
        }
    })
    // List of authorizedRoutes for each user

    // match the permissions of each use to a route in authroized role
    const userRole = decoded.permissions.roleName;
    const userPermissions = decoded.permissions.actions;
    const userRoutes = []
    userPermissions.map((perm)=>{
        if (Array.isArray(perm.actions)){
            perm.actions.forEach(element => {
                userRoutes.push(`${element + perm.resource}`)
            });
        }
        else {
            console.log("The user has no permissions");
            return res.status(401).send("Unauthorised");
        }
    })
    if (userRoutes.length() > 0){
        
    }
    // Run the regex check against each one 
}