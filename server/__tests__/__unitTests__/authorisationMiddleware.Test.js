// Import functions to test 

// To mock the API request made by the user 
// Mock the jwt.verify function since i am not using an actual token and secret key, returns decoded role on the payload
// +Don't mock find since u should test the function
const {checkPermissions, verifyJWT, matchEndpoint} = require("../../authentication/authorisationMiddleware");
const jwt = require("jsonwebtoken");
const consoleSpy = jest.spyOn(console, 'log').mockImplementation((message) => {
    // Log the message to the test console for visibility, mock the function jest.spyOn() to spy on each console log 
    process.stdout.write(`${message}\n`);
});
describe("Test for authorisation middlware",() => {
    beforeEach(()=> {
        consoleSpy.mockClear() // clear the mocked function 
        jest.clearAllMocks()
    })

    // Testing for if there is an invalid token (malformed token)
    test("Request status is 404 since there is no token", ()=>{
        const request = {
            headers: {
                authorization: " "
            }
        }
        // mocking the response object 
        const res = {
            // prop of res
            statusCode: null,
            // this behaves differently in a lambda 
            status: jest.fn(function (code) {
                // invoked and pass code into it -> status code
                this.statusCode = code; // Set the status code
                return this; // Return the same object for chaining
            }),
            json: jest.fn() // Mock the json method
        };
        
    
        const next = jest.fn();
    
        verifyJWT(request, res, next);
    
        // Assertions
        expect(res.status).toHaveBeenCalledWith(401); // Check status was set to 401
        expect(res.statusCode).toEqual(401);
        expect(res.json).toHaveBeenCalledWith({ message: "Forbidden" }); // Check JSON response
        expect(next).not.toHaveBeenCalled(); // Ensure next() was not called
    })

    // Singular Unit test with mocked jwt and mocked req, res and next params

    test("It should addd user decoded role to the response",()=>{
        // Arrange
        process.env.JWT_SECRET_KEY = 'mockSecret'; // Set the mock secret
        const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvbiBEb2UiLCJhZG1pbiI6dHJ1ZX0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
        const request = {
            "url": "http://localhost:3000/get-Advertisments",
            "headers":{
                "authorization": `Bearer ${mockToken}`
            }
        }
        

        const res = {
            status: jest.fn().mockReturnThis(), // Ensures .status() returns res
            json: jest.fn() // Mock .json() method
        };

        const next = jest.fn();

        // mock jwt verify client
        jest.spyOn(jwt, 'verify').mockImplementation((token, secret, callback) => {
            const decoded = {
                role: 'Admin',
                permissions: [
                    {
                        actions: ['get', 'view', 'edit'],
                        resource: 'Advertisements'
                    }
                ]
            };
            callback(null, decoded); // Simulate successful verification
        });
        // call the function: ACT
       verifyJWT(request,res,next)

        // ASSERT
        // assert the jwt function
        expect(jwt.verify).toHaveBeenCalledWith(
            mockToken,
            'mockSecret', // The secret
            expect.any(Function) // A function (the callback)
        );

         // Assert `next` was called
        expect(next).toHaveBeenCalled();

        console.log(JSON.stringify(request,null,2));
        // Assert `req.user` contains the decoded data
        expect(request.user).toEqual(
            {
                role: 'Admin',
                permissions: [
                    {
                        actions: ['get', 'view', 'edit'],
                        resource: 'Advertisements'
                    }
                ]
            }
        );

    })

    test("Return boolearn result true if permissions exists", ()=> {
        // define the const to pas it the function to test 
        const rolePerm = {"action": "view", "resource": "Advertisements"};
        const permissions =  [
            {
              "actions": [
                "get",
                "view",
                "edit"
              ],
              "resource": "Advertisements"
            }
        ]
        const result = checkPermissions(rolePerm,permissions)
        expect(result).toEqual(
            true
        )
    })

    test("Return boolean result false as resource does not match expected", ()=>{
        const rolePerm = {"action": "view", "resource": "Advertisements"};
        const permissions =  [
            {
              "actions": [
                "get",
                "view",
                "edit"
              ],
              "resource": "Campaigns"
            }
        ]
        const result = checkPermissions(rolePerm,permissions)
        expect(result).toEqual(
            false
        )
    })


})  