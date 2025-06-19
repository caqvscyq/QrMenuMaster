import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { logger } from '../config/logger';

let io: SocketIOServer;

export function initSocketService(server: HTTPServer): SocketIOServer {
  logger.info('Socket.IO server initialized');
  
  io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:5000"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Connection handling
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Handle table joining
    socket.on('join-table', (tableNumber: string) => {
      const room = `table-${tableNumber}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined table ${tableNumber}`);
      
      // Notify others in the room
      socket.to(room).emit('user-joined', {
        socketId: socket.id,
        tableNumber
      });
    });

    // Handle leaving table
    socket.on('leave-table', (tableNumber: string) => {
      const room = `table-${tableNumber}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left table ${tableNumber}`);
      
      // Notify others in the room
      socket.to(room).emit('user-left', {
        socketId: socket.id,
        tableNumber
      });
    });

    // Handle order updates
    socket.on('order-update', (data: { tableNumber: string; orderId: number; status: string }) => {
      const room = `table-${data.tableNumber}`;
      logger.info(`Order update for table ${data.tableNumber}: Order ${data.orderId} -> ${data.status}`);
      
      // Broadcast to all clients in the table room
      io.to(room).emit('order-status-changed', {
        orderId: data.orderId,
        status: data.status,
        tableNumber: data.tableNumber,
        timestamp: new Date().toISOString()
      });
    });

    // Handle cart updates
    socket.on('cart-update', (data: { tableNumber: string; sessionId: string; action: string }) => {
      const room = `table-${data.tableNumber}`;
      logger.info(`Cart update for table ${data.tableNumber}: ${data.action}`);
      
      // Broadcast to all clients in the table room
      socket.to(room).emit('cart-changed', {
        sessionId: data.sessionId,
        action: data.action,
        tableNumber: data.tableNumber,
        timestamp: new Date().toISOString()
      });
    });

    // Handle admin notifications
    socket.on('join-admin', () => {
      socket.join('admin-room');
      logger.info(`Admin socket ${socket.id} joined admin room`);
    });

    socket.on('leave-admin', () => {
      socket.leave('admin-room');
      logger.info(`Admin socket ${socket.id} left admin room`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  return io;
}

// Helper functions to emit events from other parts of the application
export function emitOrderUpdate(tableNumber: string, orderId: number, status: string, orderData?: any) {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit order update');
    return;
  }

  const room = `table-${tableNumber}`;
  logger.info(`Emitting order update to table ${tableNumber}: Order ${orderId} -> ${status}`);
  
  io.to(room).emit('order-status-changed', {
    orderId,
    status,
    tableNumber,
    orderData,
    timestamp: new Date().toISOString()
  });

  // Also notify admin
  io.to('admin-room').emit('admin-order-update', {
    orderId,
    status,
    tableNumber,
    orderData,
    timestamp: new Date().toISOString()
  });
}

export function emitCartUpdate(tableNumber: string, sessionId: string, action: string, cartData?: any) {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit cart update');
    return;
  }

  const room = `table-${tableNumber}`;
  logger.info(`Emitting cart update to table ${tableNumber}: ${action}`);
  
  io.to(room).emit('cart-changed', {
    sessionId,
    action,
    tableNumber,
    cartData,
    timestamp: new Date().toISOString()
  });
}

export function emitAdminNotification(type: string, data: any) {
  if (!io) {
    logger.warn('Socket.IO not initialized, cannot emit admin notification');
    return;
  }

  logger.info(`Emitting admin notification: ${type}`);
  
  io.to('admin-room').emit('admin-notification', {
    type,
    data,
    timestamp: new Date().toISOString()
  });
}

export function getSocketIO(): SocketIOServer | null {
  return io || null;
}

export default {
  initSocketService,
  emitOrderUpdate,
  emitCartUpdate,
  emitAdminNotification,
  getSocketIO
};
