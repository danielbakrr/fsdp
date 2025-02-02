const ClientManager = require('./ClientManager');
const wsClient = new ClientManager();
const WebSocket = require('ws');
const allowedOrigin = ['http://localhost:3000/','localhost:5000']
// Adding clients to the websocket 
const setupWebSocketServer = function(server) {
    // fo not upgrade to the server automatically
    const wss = new WebSocket.Server({ noServer: true });
    wss.on('error', (err) => {
        console.log('WebSocket server error:', err);
    });
    
    let allow  = false;
    // Initialize the WebSocket server
    try{
        server.on('upgrade', (req, socket, head) => {
            // Check the req 
            console.log(req);
            console.log('Upgrade request received');
            const headers = req.headers;
            console.log(headers);
            if (!req.headers.connection === "Upgrade" || req.headers.upgrade.toLowerCase() != 'websocket'){
                console.log('Invalid request headers');
                socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
                socket.destroy();
            }
            for (const origin of allowedOrigin) {
                if(headers.origin == origin) {
                    console.log('Origin is allowed: ',headers.origin);
                    wss.handleUpgrade(req, socket, head, (ws) => {
                        wss.emit('connection', ws, req);
                        onConnect(ws, req);
                        allow = true
                    });
                }
                
            }

            if (allow == false) {
                console.log('Origin is not allowed');
                socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
                socket.destroy();
            }
            
        });
    }
    catch(err){
        console.log(err);
    }
  
};

const closeConnection = function (wsClient, user_id) {
  const client = wsClient.getClient(user_id);
  if (client) {
    client.ws.close();
    wsClient.removeClient(user_id); 
  }
};

const onConnect = function (ws, req) {
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const { user_id, tvID } = data; 

    if (!user_id || !tvID) {
      ws.close();
      return;
    }

    const clientData = {
      client_id: user_id,
      tvID: tvID, 
      ws: ws,
    };
    wsClient.saveClient(clientData);

    ws.join(tvID);
    console.log(`User ${user_id} joined TV room: ${tvID}`);
  });
};

const sendUsersConnected = function (tvID, ads) {
  const wsList = wsClient.getClientList();
  console.log("This is tvID: ", tvID);
  console.log(wsList);

  const data = {
    adContent: ads.adContent,
    uploadedDate: new Date().toISOString(),
  };

  wsList.forEach((client) => {
    if (client.tvID === tvID) { 
      console.log("Sending to client: ", client.client_id);
      client.ws.send(JSON.stringify(data));
    }
  });
};

// remove the connected client from the websocket 

module.exports = {
    setupWebSocketServer,
    sendUsersConnected,
};