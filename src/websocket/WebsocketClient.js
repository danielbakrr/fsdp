import { io } from 'socket.io-client';

class SocketIOClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.onMessageCallback = null;
    this.onConnectionChangeCallback = null;
    this.connectedTVs = new Set(); // Track connected TVs by their IDs
  }

  // Connect to the Socket.IO server
  connect() {
    this.socket = io(this.url);

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(false);
      }
    });

    this.socket.on('tv_connected', (data) => {
      this.connectedTVs.add(data.tvId);
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(true, data.tvId);
      }
    });

    this.socket.on('tv_disconnected', (data) => {
      this.connectedTVs.delete(data.tvId);
      if (this.onConnectionChangeCallback) {
        this.onConnectionChangeCallback(false, data.tvId);
      }
    });

    this.socket.on('ad_update', (data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }
    });
  }

  // Join a TV room
  joinTV(tvId) {
    if (this.socket) {
      this.socket.emit('join_tv', tvId);
    }
  }

  // Send an ad update
  sendAdUpdate(tvId, ad) {
    if (this.socket) {
      this.socket.emit('ad_update', { tvId, ad });
    }
  }

  // Register a callback for incoming messages
  onMessage(callback) {
    this.onMessageCallback = callback;
  }

  // Register a callback for connection changes
  onConnectionChange(callback) {
    this.onConnectionChangeCallback = callback;
  }

  // Get the list of connected TV IDs
  getConnectedTVs() {
    return Array.from(this.connectedTVs);
  }

  // Disconnect from the Socket.IO server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default SocketIOClient;