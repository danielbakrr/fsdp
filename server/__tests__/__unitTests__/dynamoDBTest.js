const { mockClient } = require("aws-sdk-client-mock");
const {dynamoDb} = require('../../awsConfig');
const {DynamoDBDocumentClient, PutItemCommand, GetItemCommand} = require('@aws-sdk/client-dynamodb');
const {Role} = require("../../role")
// instantiate the mockClient with aws 
const ddbMock = mockClient(dynamoDb);

// use the dynamoDb client from your aws config to mock 
describe("Testing dynamoDB functions on roles table", ()=>{
    beforeEach(() => {
        ddbMock.reset();
        // Spy on console.log
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation((message) => {
            // Log the message to the test console for visibility
            process.stdout.write(`${message}\n`);
        });
    });

    afterEach(() => {
        // Restore the original console.log
        consoleLogSpy.mockRestore();
    });

    it("Should return the item inserted to dynamoDB", async () =>{
        // S is for string datatype, L is for list datatype and M is for Map datatype
        ddbMock.on(PutItemCommand).resolves({
            Attributes: {
                    "roleName": { "S": "Admin" },
                    "permissions": {
                      "L": [
                        {
                          "M": {
                            "Actions": { "L": [{ "S": "get" }, { "S": "view" }, { "S": "edit" }] },
                            "resource": { "S": "Advertisements" }
                          },
                          "M": {
                            "Actions": { "L": [{ "S": "get" }, { "S": "view" }, { "S": "edit" }] },
                            "resource": { "S": "Campaigns" }
                          }
                        }
                      ]
                    },
                }
        });
        const role = {
            roleId: "Admin", // A unique identifier for the role
            permissions: [
                {
                    "Actions": ["get","view","edit"],
                    "resource": "Advertisements"
                },
                {
                    "Actions": ["get","view","edit"],
                    "resource": "Campaigns"
                }
            ],
            roleName: "Admin", // The name of the role
        };
        
        const result = await Role.createRole(role);
        // assert the values of the test (result with the expected result)
        expect(result.Attributes.roleName).toEqual({"S":"Admin"});
        expect(result.Attributes.permissions).toEqual({
            "L" : [
                    {
                        "M" : {
                            "Actions": {"L" : [{"S":"get"},{"S":"view"},{"S":"edit"}]},
                            "resource": {"S" : "Advertisements"}
                        },
                        "M" : {
                            "Actions": {"L" : [{"S":"get"},{"S":"view"},{"S":"edit"}]},
                            "resource": {"S" : "Campaigns"}
                        }
                    }
                ]
        })
    })
    it("should return the role of the user as a role object", async ()=>{
        // call the getitemCommand
        ddbMock.on(GetItemCommand).resolves({
            // expected result of the test
            "Item":{
                "roleName": { "S": "Admin" },
                "permissions": { "L" : [
                        {
                            "M" : {
                                "Actions": {"L" : [{"S":"get"},{"S":"view"},{"S":"edit"}]},
                                "resource": {"S" : "Advertisements"}
                            },
                            
                        },
                        {
                            "M" : {
                                "Actions": {"L" : [{"S":"get"},{"S":"view"},{"S":"edit"}]},
                                "resource": {"S" : "Campaigns"}
                            }
                        }
                    ],
                },
            }
        })

        // assert the test results
        const result = await Role.getPermissions("Admin");
        expect(result).toEqual({
            "roleName": "Admin",                                                                                                                                                                        
            "permissions": [
              {
                "actions": [
                  "get",
                  "view",
                  "edit"
                ],
                "resource": "Advertisements"
              },
              {
                "actions": [
                    "get",
                    "view",
                    "edit"
                  ],
                  "resource": "Campaigns"
              }
            ],
          })
    })
})