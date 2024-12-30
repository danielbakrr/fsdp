
import {
    InitiateAuthCommand,
    AuthFlowType,
    CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

var clientId = process.env.APP_CLIENT_ID;

const loginUser = async (req,res) => {
    // Destructure the json request 
    const {email,password} = req.body;
    // call the initateAuth method instead 
    const initiateAuth = ({email,password,clientId}) => {
        const client = new CognitoIdentityProviderClient({});

        const command = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_SRP_AUTH,
            AuthParameters: {
                Email: email,
                PASSWORD: password,
            },
            ClientId: clientId,
        });
        return client.send(command);
    }
}

const checkAuth = (req, res, next) => {
    if (!req.session.userInfo) {
        req.isAuthenticated = false;
    } else {
        req.isAuthenticated = true;
    }
    next();
};

const logoutUser = async (req,res) => {
    // User has logged out (logout method in cognito user pool ?)
}

