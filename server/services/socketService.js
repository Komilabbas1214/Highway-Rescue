let io = null;

const initSocket = (server) => {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    // Join room based on user role and ID
    socket.on('join', ({ userId, role, mechanicId }) => {
      if (userId) {
        socket.join(`user_${userId}`);
        console.log(`[Socket.io] User ${userId} joined room user_${userId}`);
      }
      if (mechanicId) {
        socket.join(`mechanic_${mechanicId}`);
        socket.join('active_mechanics');
        console.log(`[Socket.io] Mechanic ${mechanicId} joined mechanic_${mechanicId}`);
      }
      if (role === 'admin') {
        socket.join('admin_room');
        console.log(`[Socket.io] Admin joined admin_room`);
      }
    });

    // Handle mechanic location update in real-time
    socket.on('updateMechanicLocation', ({ bookingId, lat, lng }) => {
      if (bookingId && lat && lng) {
        io.to(`booking_${bookingId}`).emit('mechanicLiveLocation', {
          bookingId,
          lat,
          lng,
          timestamp: new Date(),
        });
      }
    });

    // Join specific booking room for live tracking
    socket.on('joinBookingRoom', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`[Socket.io] Socket ${socket.id} joined booking_${bookingId}`);
    });

    socket.on('leaveBookingRoom', (bookingId) => {
      socket.leave(`booking_${bookingId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

// Emit real-time notification to specific mechanic
const notifyMechanic = (mechanicId, event, data) => {
  if (io) {
    io.to(`mechanic_${mechanicId}`).emit(event, data);
  }
};

// Broadcast new booking to all eligible active mechanics
const broadcastToMechanics = (event, data) => {
  if (io) {
    io.to('active_mechanics').emit(event, data);
  }
};

// Emit status update to customer
const notifyCustomer = (customerId, event, data) => {
  if (io) {
    io.to(`user_${customerId}`).emit(event, data);
  }
};

// Emit to live booking room (for both customer & mechanic live view)
const notifyBookingRoom = (bookingId, event, data) => {
  if (io) {
    io.to(`booking_${bookingId}`).emit(event, data);
  }
};

// Emit to admin dashboard
const notifyAdmin = (event, data) => {
  if (io) {
    io.to('admin_room').emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  notifyMechanic,
  broadcastToMechanics,
  notifyCustomer,
  notifyBookingRoom,
  notifyAdmin,
};
