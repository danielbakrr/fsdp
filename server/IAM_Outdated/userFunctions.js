// Import the IAM client 
const {iamClient} = require('../awsConfig');
const {GetUserCommand,DeleteUserCommand,ListAttachedUserPoliciesCommand,GetPolicyCommand} = require('@aws-sdk/client-iam');

async function getIAMUser(username) {
    params = {
        "UserName" : username
    }
    try{
        const command = new GetUserCommand(params);
        const user = await iamClient.send(command);
        return user;
    }
    catch (error) {
        console.log('Error', error);
    }
}

async function deleteIAMUser(username){
    const param = {
        UserName: username
    }
    try{
        const command = new DeleteUserCommand(param);
        const response = await iamClient.send(command);
        return response;
    }
    catch (error){
        console.log('Error', error);
    }
}

async function getPolicyPermissions(username,role){
    try{
        const params = {
            UserName: username,
            role: role
        }
        const policyParams = await getUserPolicy(params);
        const policyCommand = new GetPolicyCommand({
            PolicyArn: "arn:aws:iam::123456789012:policy/MyCustomPolicy"
        });
        console.log(policyCommand);
        const policyResponse = await iamClient.send(policyCommand);
        console.log(policyResponse);
        // Log the response of the policy
        const policyData = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument));
        if (policyData != null){
            // Parse the policyData to extract all the permissions 
            let permissions = [];
            policyData.Statement.forEach(statement => {
                const actions = statement.Action;
                if (Array.isArray(actions)){
                    actions.forEach(action => {
                        permissions.push(action);
                    })
                }
                else {
                    permissions.push(actions);
                }
            });
            if (permissions.length > 0){
                console.log(permissions);
                return permissions;
            }
        }
    }
    catch (error){
        console.log('Error', error);
    }
    
    
}
async function getUserPolicy(params){
    const command = new ListAttachedUserPoliciesCommand({
        UserName:params.UserName.UserName});
    const response = await iamClient.send(command);
    // assign policy to each policyName in the policies array and compare if the name is the same as role
    const policy = response.AttachedPolicies.find(policy => policy.PolicyName === `${params.UserName.role}Policy`);
    if (policy == null){
        return null;
    }
    return policy;
}
// Retrieve Policy for attached user 

module.exports = {getIAMUser, deleteIAMUser, getPolicyPermissions, getUserPolicy};