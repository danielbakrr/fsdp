const { mockClient } = require("aws-sdk-client-mock");
const { getIAMUser, getUserPolicy, getPolicyPermissions} = require("../IAM/userFunctions");
const { IAMClient, GetUserCommand, ListAttachedUserPoliciesCommand,GetPolicyCommand} = require("@aws-sdk/client-iam");

const iamClientMock = mockClient(IAMClient);

describe("IAM User functions", () => {
    beforeEach(() => {
        iamClientMock.reset();
    });

    it("Should return the user associated with the userName", async () => {
        // Mock the response
        iamClientMock.on(GetUserCommand, { UserName: "Bob" }).resolves({
            User: {
                Arn: "arn:aws:iam::123456789012:user/Bob",
                CreateDate: "2012-09-21T23:03:13Z",
                Path: "/",
                UserId: "AKIAIOSFODNN7EXAMPLE",
                UserName: "Bob"
            }
        });

        // Execute the test
        const user = await getIAMUser("Bob");
        console.log(user);

        // Assert
        expect(user.User.UserName).toBe("Bob");
    });
});

// Test for the IAM retrieve policy function 
describe("Retirieving the IAM user's policy and permissions" , () => {
    beforeEach(() => {
        iamClientMock.reset();
    });


    // first test case test if the policy id retrived
    it("Should return the permissions associated with the corresponding IAM user", async () => {
        
        iamClientMock.on(ListAttachedUserPoliciesCommand, {UserName: "Bob"}).resolves({
        "AttachedPolicies": [
            {
                "PolicyName": "AdminPolicy",
                "PolicyArn": "arn:aws:iam::123456789012:policy/MyCustomPolicy"
            },
            {
                "PolicyName": "SecurityAudit",
                "PolicyArn": "arn:aws:iam::aws:policy/SecurityAudit"
            }
        ],
        "IsTruncated": false
        })

        // After this we have to test if my json parser works 

        const policyDocument = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Action: [
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    Resource: "*"
                },
                {
                    Effect: "Allow",
                    Action: [
                        "dynamodb:Scan",
                        "dynamodb:GetBatchItems"
                    ],
                    Resource: "*"
                }
            ]
        };
        // // Test for second part 
        iamClientMock.on(GetPolicyCommand, {
            PolicyArn: "arn:aws:iam::123456789012:policy/MyCustomPolicy"
        })
        .resolves({
            "UserName" : "Bob",
            "PolicyName" : "AdminPolicy",
            "PolicyDocument" : encodeURIComponent(JSON.stringify(policyDocument))
        })
        const permissions = await getPolicyPermissions({
            UserName: "Bob",
            role: "Admin"
        });
        expect(permissions).toEqual(["s3:PutObject","s3:DeleteObject", "dynamodb:Scan","dynamodb:GetBatchItems"]);
    });

})

        