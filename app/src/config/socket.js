const { Server } = require('socket.io');

let io;

/**
 * Initializes the Socket.io server and attaches it to the provided HTTP server.
 * Sets up room-based subscriptions for real-time seat availability updates.
 */
const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for this implementation
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Client event to join a specific train room
    socket.on('join_train_room', (payload) => {
      const { trainId, journeyDate, travelClass } = payload;
      if (trainId && journeyDate && travelClass) {
        const roomName = `train:${trainId}:${journeyDate}:${travelClass}`;
        socket.join(roomName);
        console.log(`[Socket] Client ${socket.id} joined room: ${roomName}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Returns the initialized Socket.io server instance.
 */
const getIo = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized.');
  }
  return io;
};

/**
 * Helper function to emit seat updates to clients subscribed to a specific train room.
 * Safely ignores calls if the Socket.io server is not yet initialized.
 */
const emitSeatUpdate = (trainId, journeyDate, travelClass, availableSeats) => {
  if (!io) return;
  
  const roomName = `train:${trainId}:${journeyDate}:${travelClass}`;
  
  io.to(roomName).emit('seat_update', {
    trainId,
    journeyDate,
    travelClass,
    availableSeats: parseInt(availableSeats, 10)
  });
};

module.exports = { initSocket, getIo, emitSeatUpdate };
