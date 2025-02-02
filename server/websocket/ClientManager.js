class ClientManager {
    constructor() {
      this.clientList = [];
    }
  
    saveClient(object) {
      this.clientList.push(object);
    }
  
    getClient(client_id) {
      return this.clientList.find((client) => client.client_id === client_id);
    }
  
    getClientList() {
      return this.clientList;
    }
  
    removeClient(client_id) {
      this.clientList = this.clientList.filter((client) => client.client_id !== client_id);
    }
  }
  
  module.exports = ClientManager;