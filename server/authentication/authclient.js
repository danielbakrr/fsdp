const session = require('express-session');
const {Issuer, generators} = require('openid-client');

let client;

async function intializeClient(){
    const issuer = await Issuer.discover('https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_3lJA9JC01');
    client = new issuer.Client({
        client_id: '4orfepcg9cqnc8rc9uma74gbu3',
        client_secret: '<client_secret>',
        redirect_uris: ['http://localhost:3000'],
        response_types: ['code']
    });

};

intializeClient().catch(console.error);

