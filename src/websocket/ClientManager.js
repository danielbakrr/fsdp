class ClientManager{
    constructor(){
        this.clientList = [];
        this.saveClient = this.saveClient.bind(this);
        this.getClient = this.getClient.bind(this);
    }
    
    // Save the client to the list of connected clients on successful web socket connection

    saveClient(object){
        this.clientList.push(object);
    }

    getClient(client_id){
        this.clientList.forEach((client)=>{
            if(client.client_id === client_id){
                return client.ws;
            }
        })
    }

    // retutn the list of connected clients
    getClientList(){
        return this.clientList;
    }
}

module.exports = ClientManager;