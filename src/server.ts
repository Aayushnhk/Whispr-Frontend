// src/server.ts
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
process.env.DEBUG = 'socket.io:*';

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { connect } from 'mongoose';
import path from 'path';
import Message, { IMessage } from './models/Message';
import User, { IUser } from './models/User';

// Extend Socket interface
declare module 'socket.io' {
  interface Socket {
    userId?: string;
    firstName?: string;
    lastName?: string;
    activeRooms: Set<string>;
  }
}

// Socket event payload interfaces
interface JoinPrivateRoomArgs {
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  receiverId: string;
  receiverFirstName?: string;
  receiverLastName?: string;
}

interface PrivateMessageArgs {
  id: string; // Client-generated temporary ID
  senderId: string;
  senderFirstName: string;
  senderLastName: string;
  receiverId: string;
  receiverFirstName: string;
  receiverLastName: string;
  text?: string;
  fileUrl?: string;
  fileType?: 'image' | 'video' | 'audio' | 'document' | 'other';
  fileName?: string;
  replyTo?: {
    id: string;
    sender: string;
    text?: string;
    fileUrl?: string;
    fileType?: 'image' | 'video' | 'audio' | 'document' | 'other';
    fileName?: string;
  };
}

interface SendMessageArgs {
  id: string; // Client-generated temporary ID
  userId: string;
  firstName: string;
  lastName: string;
  text?: string;
  room: string;
  fileUrl?: string;
  fileType?: 'image' | 'video' | 'audio' | 'document' | 'other';
  fileName?: string;
  replyTo?: {
    id: string;
    sender: string;
    text?: string;
    fileUrl?: string;
    fileType?: 'image' | 'video' | 'audio' | 'document' | 'other';
    fileName?: string;
  };
}

interface TypingArgs {
  room?: string;
  firstName: string;
  lastName: string;
  senderId?: string;
  receiverId?: string;
}

interface EditMessageArgs {
  messageId: string;
  newText: string;
  userId: string;
}

interface DeleteMessageArgs {
  messageId: string;
  userId: string;
}

interface GetPrivateMessagesArgs {
  user1Id: string;
  user2Id: string;
}

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [process.env.NEXT_PUBLIC_URL || 'http://localhost:4000', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.SOCKET_SERVER_PORT || 4001;
const MONGODB_URI = process.env.MONGODB_URI;
const NEXT_PUBLIC_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:4000';

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env');
  process.exit(1);
}
if (!NEXT_PUBLIC_URL) {
  console.error('Error: NEXT_PUBLIC_URL is not defined in .env');
  process.exit(1);
}

console.log('Environment variables:', {
  MONGODB_URI: MONGODB_URI.slice(0, 20) + '...',
  SOCKET_SERVER_PORT: PORT,
  NEXT_PUBLIC_URL,
});

// Track user presence
const users = new Map<
  string,
  { userId: string; firstName: string; lastName: string; currentRoom: string | null }
>();
const usersInPublicRooms = new Map<string, Set<string>>();
const usersInPrivateRooms = new Map<string, Set<string>>();
const userSockets = new Map<string, Set<string>>();
const typingUsers = new Map<string, Set<string>>();
// globalOnlineUsers will now store user objects, not just strings, mapped by userId
const globalOnlineUsers = new Map<string, { userId: string; fullName: string; profilePicture: string; }>();

// Generate private room ID
const getPrivateRoomId = (userId1: string, userId2: string): string => {
  const sortedIds = [userId1, userId2].sort();
  return `private_${sortedIds[0]}_${sortedIds[1]}`;
};

// Socket middleware for logging
io.use((socket: Socket, next) => {
  console.log(`Socket ${socket.id} connected`);
  socket.onAny((event, ...args) => {
    console.log(`Socket ${socket.id} ${args}`);
  });
  next();
});

io.on('connection', (socket: Socket) => {
  socket.activeRooms = new Set();

  // Register user
  socket.on(
    'registerUser',
    async (userId: string, firstName: string, lastName: string, profilePicture?: string) => {
      // Validate inputs
      if (!userId || userId === 'undefined' || !firstName || !lastName) {
        console.warn('Invalid registration data:', { userId, firstName, lastName });
        socket.emit('error', 'Invalid registration data: userId, firstName, and lastName are required');
        return;
      }

      try {
        const userDoc = await User.findById(userId); // Renamed user to userDoc to avoid conflict
        if (!userDoc) {
          socket.emit('error', 'User not found');
          return;
        }
        if (userDoc.banned) {
          socket.emit('error', 'User is banned');
          return;
        }
        if (userDoc.profilePicture === undefined || userDoc.profilePicture === null) {
          userDoc.profilePicture = '/default-avatar.png';
          await userDoc.save();
        }

        socket.userId = userId;
        socket.firstName = firstName;
        socket.lastName = lastName;

        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);

        const fullName = `${firstName} ${lastName}`;
        const profilePictureValue = profilePicture || userDoc.profilePicture || '/default-avatar.png';

        // Store the full user object in globalOnlineUsers map by userId
        if (!globalOnlineUsers.has(userId)) {
          globalOnlineUsers.set(userId, { userId, fullName, profilePicture: profilePictureValue });
          // Broadcast to all if a new user came online
          io.emit('onlineUsers', Array.from(globalOnlineUsers.values()));
        }
        // Send the current list to the connecting client
        socket.emit('onlineUsers', Array.from(globalOnlineUsers.values()));
        console.log(
          `User ${fullName} (${userId}) registered with socket ${socket.id}. Online: ${globalOnlineUsers.size}`
        );
      } catch (error) {
        console.error(`Error verifying user ${userId}:`, error);
        socket.emit('error', 'Failed to verify user');
        return;
      }
    }
  );

  // Join public room
  socket.on(
    'joinRoom',
    async (room: string, userId: string, firstName: string, lastName: string) => {
      // Validate inputs
      if (!room || !userId || userId === 'undefined' || !firstName || !lastName) {
        console.warn('Invalid join data:', { room, userId, firstName, lastName });
        socket.emit('error', 'Invalid join data: room, userId, firstName, and lastName are required');
        return;
      }

      try {
        const userDoc = await User.findById(userId); // Fetch user to get profilePicture
        if (!userDoc || userDoc.banned) {
          socket.emit('error', userDoc ? 'User is banned' : 'User not found');
          return;
        }
        if (userDoc.profilePicture === undefined || userDoc.profilePicture === null) {
          userDoc.profilePicture = '/default-avatar.png';
          await userDoc.save();
        }
      } catch (error) {
        console.error(`Error verifying user ${userId}:`, error);
        socket.emit('error', 'Failed to verify user');
        return;
      }

      if (!socket.userId || socket.userId !== userId) {
        socket.userId = userId;
        socket.firstName = firstName;
        socket.lastName = lastName;

        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);
      }

      const previousPublicRoom = users.get(socket.id)?.currentRoom;
      if (previousPublicRoom && previousPublicRoom !== room) {
        socket.leave(previousPublicRoom);
        socket.activeRooms.delete(previousPublicRoom);
        const prevRoomUsers = usersInPublicRooms.get(previousPublicRoom);
        if (prevRoomUsers) {
          const fullName = `${socket.firstName} ${socket.lastName}`;
          prevRoomUsers.delete(fullName);
          io.to(previousPublicRoom).emit('userLeft', {
            username: fullName,
            room: previousPublicRoom,
          });
        }
        if (typingUsers.has(previousPublicRoom)) {
          const fullName = `${socket.firstName} ${socket.lastName}`;
          typingUsers.get(previousPublicRoom)!.delete(fullName);
          io.to(previousPublicRoom).emit('userStoppedTyping', {
            username: fullName,
            room: previousPublicRoom,
          });
        }
      }

      socket.join(room);
      socket.activeRooms.add(room);
      const fullName = `${firstName} ${lastName}`;
      users.set(socket.id, { userId, firstName, lastName, currentRoom: room });

      if (!usersInPublicRooms.has(room)) {
        usersInPublicRooms.set(room, new Set());
      }
      usersInPublicRooms.get(room)!.add(fullName);

      console.log(`${fullName} (${userId}) joined room: ${room}`);
      socket.to(room).emit('userJoined', {
        username: fullName,
        room,
      });

      // Ensure user is added to globalOnlineUsers if not already, with full details
      if (!globalOnlineUsers.has(userId)) {
        const userDoc = await User.findById(userId); // Re-fetch to guarantee profilePicture if not already
        const profilePicture = userDoc?.profilePicture || '/default-avatar.png';
        globalOnlineUsers.set(userId, { userId, fullName, profilePicture });
        io.emit('onlineUsers', Array.from(globalOnlineUsers.values())); // Broadcast new user online
      }
      // Send full online list to the joining user (values from the Map)
      socket.emit('onlineUsers', Array.from(globalOnlineUsers.values()));
    }
  );

  // Join private room
  socket.on(
    'joinPrivateRoom',
    async (
      {
        senderId,
        senderFirstName,
        senderLastName,
        receiverId,
        receiverFirstName,
        receiverLastName,
      }: JoinPrivateRoomArgs,
      callback: (response: { success: boolean; message?: string; room?: string; userId?: string; error?: string }) => void
    ) => {
      if (!senderId || !receiverId || !senderFirstName || !senderLastName) {
        console.warn('Invalid private room join data:', {
          senderId,
          senderFirstName,
          senderLastName,
          receiverId,
        });
        callback({ success: false, error: 'Invalid private room data' });
        return;
      }

      try {
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (!sender || !receiver) {
          callback({ success: false, error: 'User not found' });
          return;
        }
        if (sender.banned || receiver.banned) {
          callback({ success: false, error: 'One or both users are banned' });
          return;
        }
        if (sender.profilePicture === undefined || sender.profilePicture === null) {
          sender.profilePicture = '/default-avatar.png';
          await sender.save();
        }
        if (receiver.profilePicture === undefined || receiver.profilePicture === null) {
          receiver.profilePicture = '/default-avatar.png';
          await receiver.save();
        }
      } catch (error) {
        console.error(`Error verifying users ${senderId}, ${receiverId}:`, error);
        callback({ success: false, error: 'Failed to validate users' });
        return;
      }

      const senderFullName = `${senderFirstName} ${senderLastName}`;
      const privateRoomId = getPrivateRoomId(senderId, receiverId);

      if (!socket.activeRooms.has(privateRoomId)) {
        socket.join(privateRoomId);
        socket.activeRooms.add(privateRoomId);
        socket.userId = senderId;
        socket.firstName = senderFirstName;
        socket.lastName = senderLastName;

        if (!usersInPrivateRooms.has(privateRoomId)) {
          usersInPrivateRooms.set(privateRoomId, new Set());
        }
        usersInPrivateRooms.get(privateRoomId)!.add(senderId);

        console.log(
          `User ${senderFullName} (${senderId}) joined private room: ${privateRoomId}`
        );
      }

      const fetchReceiverDetails = async () => {
        try {
          const receiverUser = await User.findById(receiverId);
          if (receiverUser) {
            return {
              firstName: receiverUser.firstName,
              lastName: receiverUser.lastName,
            };
          }
          return { firstName: 'Unknown', lastName: '' };
        } catch (error) {
          console.error(`Error fetching receiver details for ${receiverId}:`, error);
          return { firstName: 'Unknown', lastName: '' };
        }
      };

      (async () => {
        let updatedFirstName = receiverFirstName;
        let updatedLastName = receiverLastName;

        if (!receiverFirstName || !receiverLastName) {
          const receiverDetails = await fetchReceiverDetails();
          updatedFirstName = receiverDetails.firstName;
          updatedLastName = receiverDetails.lastName;
          console.log(
            `Updated receiver to ${updatedFirstName} ${updatedLastName} from database`
          );
        }

        const receiverFullName = `${updatedFirstName} ${updatedLastName}`;
        const receiverSockets = userSockets.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((receiverSocketId) => {
            const receiverSocket = io.sockets.sockets.get(receiverSocketId);
            if (receiverSocket && !receiverSocket.activeRooms.has(privateRoomId)) {
              receiverSocket.join(privateRoomId);
              receiverSocket.activeRooms.add(privateRoomId);
              if (!usersInPrivateRooms.has(privateRoomId)) {
                usersInPrivateRooms.set(privateRoomId, new Set());
              }
              usersInPrivateRooms.get(privateRoomId)!.add(receiverId);
              console.log(
                `Forced join for ${receiverFullName} (${receiverId}) in ${privateRoomId}`
              );
            }
          });
        }

        callback({ success: true, message: 'Joined private room', room: privateRoomId, userId: senderId });
      })();
    }
  );

  // Leave private room
  socket.on(
    'leavePrivateRoom',
    ({ senderId, receiverId }: { senderId: string; receiverId: string }) => {
      if (!senderId || !receiverId) {
        console.warn('Invalid leave private room data:', { senderId, receiverId });
        socket.emit('error', 'Invalid leave data');
        return;
      }

      const privateRoomId = getPrivateRoomId(senderId, receiverId);
      if (socket.activeRooms.has(privateRoomId)) {
        socket.leave(privateRoomId);
        socket.activeRooms.delete(privateRoomId);
        if (usersInPrivateRooms.has(privateRoomId)) {
          usersInPrivateRooms.get(privateRoomId)!.delete(senderId);
          console.log(
            `User ${senderId} left private room: ${privateRoomId}`
          );
        }
      }
    }
  );

  // Send public message
  socket.on(
    'sendMessage',
    async ({
      id,
      userId,
      firstName,
      lastName,
      text,
      room,
      fileUrl,
      fileType,
      fileName,
      replyTo,
    }: SendMessageArgs) => {
      console.log('Received sendMessage:', {
        id,
        userId,
        firstName,
        lastName,
        text,
        room,
        fileUrl,
        fileType,
        fileName,
        replyTo,
      });

      if (!text && !fileUrl) {
        console.warn('Attempted to send empty message or file.');
        socket.emit('messageError', 'Message cannot be empty.');
        return;
      }

      try {
        const userDoc = await User.findById(userId);
        if (!userDoc || userDoc.banned) {
          socket.emit('error', userDoc ? 'User is banned' : 'User not found');
          return;
        }
      } catch (error) {
        console.error(`Error verifying user ${userId}:`, error);
        socket.emit('error', 'Failed to verify user');
        return;
      }

      const fullName = `${firstName} ${lastName}`;
      try {
        let replyToData;
        if (replyTo && replyTo.id) {
          const repliedMessage = await Message.findById(replyTo.id);
          if (!repliedMessage) {
            console.warn(`Replied message with ID ${replyTo.id} not found.`);
            socket.emit('messageError', 'Replied message not found.');
            return;
          }
          replyToData = {
            id: repliedMessage._id,
            sender: replyTo.sender || `${repliedMessage.firstName} ${repliedMessage.lastName}`,
            text: replyTo.text || repliedMessage.text,
            fileUrl: replyTo.fileUrl || repliedMessage.fileUrl,
            fileType: replyTo.fileType || repliedMessage.fileType,
            fileName: replyTo.fileName || repliedMessage.fileName,
          };
        }

        const newMessage = new Message({
          sender: userId,
          firstName,
          lastName,
          room,
          text: text || undefined,
          chatType: 'room',
          fileUrl: fileUrl || undefined,
          fileType: fileType || undefined,
          fileName: fileName || undefined,
          replyTo: replyToData || undefined,
        });
        await newMessage.save();

        if (typingUsers.has(room)) {
          typingUsers.get(room)!.delete(fullName);
          socket.to(room).emit('userStoppedTyping', { username: fullName, room });
        }

        io.to(room).emit('receiveMessage', {
          _id: newMessage._id.toString(),
          id: id,
          sender: fullName,
          senderId: userId,
          text: newMessage.text,
          timestamp: newMessage.createdAt.toISOString(),
          room: newMessage.room,
          chatType: newMessage.chatType,
          isEdited: newMessage.isEdited || false,
          fileUrl: newMessage.fileUrl || undefined,
          fileType: newMessage.fileType || undefined,
          fileName: newMessage.fileName || undefined,
          replyTo: newMessage.replyTo
            ? {
                id: newMessage.replyTo.id.toString(),
                sender: newMessage.replyTo.sender,
                text: newMessage.replyTo.text,
                fileUrl: newMessage.replyTo.fileUrl,
                fileType: newMessage.replyTo.fileType,
                fileName: newMessage.replyTo.fileName,
              }
            : undefined,
        });
        console.log(`Message sent to room ${room} by ${fullName}`);
      } catch (error: any) {
        console.error('Error saving public message:', error);
        socket.emit('messageError', 'Failed to send message.');
      }
    }
  );

  // Send private message
  socket.on(
    'privateMessage',
    async (
      {
        id,
        senderId,
        senderFirstName,
        senderLastName,
        receiverId,
        receiverFirstName,
        receiverLastName,
        text,
        fileUrl,
        fileType,
        fileName,
        replyTo,
      }: PrivateMessageArgs,
      callback: (response: { success: boolean; messageId?: string; error?: string }) => void
    ) => {
      console.log('Received privateMessage:', {
        id,
        senderId,
        senderFirstName,
        senderLastName,
        receiverId,
        receiverFirstName,
        receiverLastName,
        text,
        fileUrl,
        fileType,
        fileName,
        replyTo,
      });

      if (!text && !fileUrl) {
        console.warn('Attempted to send empty private message.');
        callback({ success: false, error: 'Private message cannot be empty.' });
        return;
      }

      if (!senderId || !receiverId || !senderFirstName || !senderLastName) {
        console.warn('Invalid private message data:', {
          senderId,
          senderFirstName,
          senderLastName,
          receiverId,
        });
        callback({ success: false, error: 'Invalid message data.' });
        return;
      }

      try {
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
        if (!sender || !receiver) {
          callback({ success: false, error: 'User not found' });
          return;
        }
        if (sender.banned || receiver.banned) {
          callback({ success: false, error: 'One or both users are banned' });
          return;
        }
      } catch (error) {
        console.error(`Error verifying users ${senderId}, ${receiverId}:`, error);
        callback({ success: false, error: 'Failed to verify users' });
        return;
      }

      const senderFullName = `${senderFirstName} ${senderLastName}`;
      const privateRoomId = getPrivateRoomId(senderId, receiverId);

      const fetchReceiverDetails = async () => {
        try {
          const receiverUser = await User.findById(receiverId);
          if (receiverUser) {
            return {
              firstName: receiverUser.firstName,
              lastName: receiverUser.lastName,
            };
          }
          return { firstName: 'Unknown', lastName: '' };
        } catch (error) {
          console.error(`Error fetching receiver details for ${receiverId}:`, error);
          return { firstName: 'Unknown', lastName: '' };
        }
      };

      try {
        let updatedFirstName = receiverFirstName;
        let updatedLastName = receiverLastName;

        if (!receiverFirstName || !receiverLastName) {
          const receiverDetails = await fetchReceiverDetails();
          updatedFirstName = receiverDetails.firstName;
          updatedLastName = receiverDetails.lastName;
        }

        const receiverFullName = `${updatedFirstName} ${updatedLastName}`;

        let replyToData;
        if (replyTo && replyTo.id) {
          const repliedMessage = await Message.findById(replyTo.id);
          if (!repliedMessage) {
            console.warn(`Replied message with ID ${replyTo.id} not found.`);
            callback({ success: false, error: 'Replied message not found.' });
            return;
          }
          replyToData = {
            id: repliedMessage._id,
            sender: replyTo.sender || `${repliedMessage.firstName} ${repliedMessage.lastName}`,
            text: replyTo.text || repliedMessage.text,
            fileUrl: replyTo.fileUrl || repliedMessage.fileUrl,
            fileType: replyTo.fileType || repliedMessage.fileType,
            fileName: replyTo.fileName || repliedMessage.fileName,
          };
        }

        const newMessage = new Message({
          sender: senderId,
          firstName: senderFirstName,
          lastName: senderLastName,
          receiver: receiverId,
          receiverFirstName: updatedFirstName,
          receiverLastName: updatedLastName,
          text: text || undefined,
          chatType: 'private',
          fileUrl: fileUrl || undefined,
          fileType: fileType || undefined,
          fileName: fileName || undefined,
          replyTo: replyToData || undefined,
        });
        await newMessage.save();

        const messageToSend = {
          _id: newMessage._id.toString(),
          id: id,
          senderId,
          senderUsername: senderFullName,
          text: newMessage.text,
          timestamp: newMessage.createdAt.toISOString(),
          chatType: newMessage.chatType,
          receiverId,
          receiverUsername: receiverFullName,
          receiverFirstName: newMessage.receiverFirstName,
          receiverLastName: newMessage.receiverLastName,
          isEdited: newMessage.isEdited || false,
          fileUrl: newMessage.fileUrl || undefined,
          fileType: newMessage.fileType || undefined,
          fileName: newMessage.fileName || undefined,
          replyTo: newMessage.replyTo
            ? {
                id: newMessage.replyTo.id.toString(),
                sender: newMessage.replyTo.sender,
                text: newMessage.replyTo.text,
                fileUrl: newMessage.replyTo.fileUrl,
                fileType: newMessage.replyTo.fileType,
                fileName: newMessage.replyTo.fileName,
              }
            : undefined,
        };

        socket.emit('receivePrivateMessage', messageToSend);
        if (usersInPrivateRooms.has(privateRoomId)) {
          io.to(privateRoomId).emit('receivePrivateMessage', messageToSend);
          console.log(`Private message broadcasted to ${privateRoomId}`);
        } else {
          console.warn(`Not broadcasting to ${privateRoomId} as both users are not present.`);
        }

        if (userSockets.has(receiverId)) {
          const receiverSocketIds = userSockets.get(receiverId)!;
          const notificationContent = text || `[File: ${fileName || 'Shared File'}]`;
          for (const receiverSocketId of receiverSocketIds) {
            const receiverSocket = io.sockets.sockets.get(receiverSocketId);
            if (receiverSocket && !receiverSocket.rooms.has(privateRoomId)) {
              receiverSocket.emit('privateMessageNotification', {
                senderId,
                senderUsername: senderFullName,
                messageSnippet:
                  notificationContent.length > 100
                    ? notificationContent.substring(0, 97) + '...'
                    : notificationContent,
                fullMessageId: messageToSend._id,
                chatType: 'private',
                timestamp: messageToSend.timestamp,
                fileUrl: messageToSend.fileUrl,
                fileType: messageToSend.fileType,
                fileName: messageToSend.fileName,
              });
              console.log(
                `Notification sent to ${receiverFullName} (socket ${receiverSocketId})`
              );
            }
          }
        }

        callback({ success: true, messageId: newMessage._id.toString() });
      } catch (error: any) {
        console.error('Error saving private message:', error);
        callback({ success: false, error: 'Failed to send private message.' });
      }
    }
  );

  // Fetch private messages
  socket.on(
    'getPrivateMessages',
    async ({ user1Id, user2Id }: GetPrivateMessagesArgs) => {
      if (!user1Id || !user2Id) {
        socket.emit('messageError', 'Invalid user IDs');
        return;
      }

      try {
        const privateRoomId = getPrivateRoomId(user1Id, user2Id);
        const messages = await Message.find({
          $or: [
            { sender: user1Id, receiver: user2Id, chatType: 'private' },
            { sender: user2Id, receiver: user1Id, chatType: 'private' },
          ],
        }).lean();
        const formattedMessages = messages.map((m) => ({
          _id: m._id.toString(),
          id: m._id.toString(),
          senderId: m.sender.toString(),
          senderUsername: `${m.firstName} ${m.lastName}`,
          text: m.text,
          timestamp: m.createdAt.toISOString(),
          receiverId: m.receiver?.toString(),
          receiverUsername:
            m.receiverFirstName && m.receiverLastName
              ? `${m.receiverFirstName} ${m.receiverLastName}`
              : undefined,
          receiverFirstName: m.receiverFirstName,
          receiverLastName: m.receiverLastName,
          chatType: m.chatType,
          isEdited: m.isEdited || false,
          fileUrl: m.fileUrl || undefined,
          fileType: m.fileType || undefined,
          fileName: m.fileName || undefined,
          replyTo: m.replyTo
            ? {
                id: m.replyTo.id.toString(),
                sender: m.replyTo.sender,
                text: m.replyTo.text,
                fileUrl: m.replyTo.fileUrl,
                fileType: m.replyTo.fileType,
                fileName: m.replyTo.fileName,
              }
            : undefined,
        }));
        socket.emit('historicalPrivateMessages', formattedMessages);
        console.log(
          `Sent ${formattedMessages.length} historical messages for ${privateRoomId}`
        );
      } catch (error: any) {
        console.error('Error fetching private messages:', error);
        socket.emit('messageError', 'Failed to fetch private messages.');
      }
    }
  );

  // Edit message
  socket.on(
    'editMessage',
    async ({ messageId, newText, userId }: EditMessageArgs) => {
      console.log(`User ${userId} attempting to edit message ${messageId}`);
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          console.warn(`Message with ID ${messageId} not found.`);
          socket.emit('messageError', 'Message not found.');
          return;
        }

        if (message.sender.toString() !== userId) {
          console.warn(`User ${userId} is not authorized to edit message ${messageId}.`);
          socket.emit('messageError', 'Not authorized to edit this message.');
          return;
        }

        if (message.fileUrl && (!newText || newText.trim() === '')) {
          socket.emit('messageError', 'Cannot edit a message that is solely a file.');
          return;
        }

        message.text = newText;
        message.isEdited = true;
        await message.save();

        const fullSenderName = `${message.firstName} ${message.lastName}`;
        const fullReceiverName =
          message.receiverFirstName && message.receiverLastName
            ? `${message.receiverFirstName} ${message.lastName}`
            : undefined;

        const updatedMessageData = {
          _id: message._id.toString(),
          id: message._id.toString(),
          senderId: message.sender.toString(),
          senderUsername: fullSenderName,
          text: message.text,
          timestamp: message.createdAt.toISOString(),
          isEdited: true,
          chatType: message.chatType,
          room: message.room || undefined,
          receiverId: message.receiver?.toString(),
          receiverUsername: fullReceiverName,
          receiverFirstName: message.receiverFirstName,
          receiverLastName: message.receiverLastName,
          fileUrl: message.fileUrl || undefined,
          fileType: message.fileType || undefined,
          fileName: message.fileName || undefined,
          replyTo: message.replyTo
            ? {
                id: message.replyTo.id.toString(),
                sender: message.replyTo.sender,
                text: message.replyTo.text,
                fileUrl: message.replyTo.fileUrl,
                fileType: message.replyTo.fileType,
                fileName: message.replyTo.fileName,
              }
            : undefined,
        };

        if (updatedMessageData.chatType === 'room' && updatedMessageData.room) {
          io.to(updatedMessageData.room).emit('messageEdited', updatedMessageData);
        } else if (updatedMessageData.chatType === 'private') {
          const privateRoomId = getPrivateRoomId(
            updatedMessageData.senderId || '',
            updatedMessageData.receiverId || ''
          );
          io.to(privateRoomId).emit('messageEdited', updatedMessageData);
        }
        console.log(`Message ${messageId} edited successfully.`);
      } catch (error: any) {
        console.error('Error editing message:', error);
        socket.emit('messageError', 'Failed to edit message.');
      }
    }
  );

  // Delete message
  socket.on(
    'deleteMessage',
    async ({ messageId, userId }: DeleteMessageArgs) => {
      console.log(`User ${userId} attempting to delete message ${messageId}`);
      try {
        const message = await Message.findById(messageId);

        if (!message) {
          console.warn(`Message with ID ${messageId} not found.`);
          socket.emit('messageError', 'Message not found.');
          return;
        }

        if (message.sender.toString() !== userId) {
          console.warn(`User ${userId} is not authorized to delete message ${messageId}.`);
          socket.emit('messageError', 'Not authorized to delete this message.');
          return;
        }

        const chatType = message.chatType;
        const room = message.room;
        const senderId = message.sender.toString();
        const receiverId = message.receiver?.toString();

        await message.deleteOne();

        if (chatType === 'room' && room) {
          io.to(room).emit('messageDeleted', { messageId });
        } else if (chatType === 'private' && receiverId) {
          const privateRoomId = getPrivateRoomId(senderId, receiverId);
          io.to(privateRoomId).emit('messageDeleted', { messageId });
        }
        console.log(`Message ${messageId} deleted successfully.`);
      } catch (error: any) {
        console.error('Error deleting message:', error);
        socket.emit('messageError', 'Failed to delete message.');
      }
    }
  );

  // Handle typing
  socket.on(
    'typing',
    ({ room, firstName, lastName, senderId, receiverId }: TypingArgs) => {
      const fullName = `${firstName} ${lastName}`;
      if (room) {
        if (!typingUsers.has(room)) {
          typingUsers.set(room, new Set());
        }
        typingUsers.get(room)!.add(fullName);
        socket.to(room).emit('userTyping', { username: fullName, room });
        console.log(`${fullName} is typing in room: ${room}`);
      } else if (senderId && receiverId) {
        const privateRoomId = getPrivateRoomId(senderId, receiverId);
        if (!typingUsers.has(privateRoomId)) {
          typingUsers.set(privateRoomId, new Set());
        }
        typingUsers.get(privateRoomId)!.add(fullName);
        socket.to(privateRoomId).emit('userTyping', {
          username: fullName,
          senderId,
          receiverId,
        });
        console.log(`${fullName} is typing in private room: ${privateRoomId}`);
      }
    }
  );

  // Handle stop typing
  socket.on(
    'stopTyping',
    ({ room, firstName, lastName, senderId, receiverId }: TypingArgs) => {
      const fullName = `${firstName} ${lastName}`;
      if (room) {
        if (typingUsers.has(room)) {
          typingUsers.get(room)!.delete(fullName);
          socket.to(room).emit('userStoppedTyping', { username: fullName, room });
          console.log(`${fullName} stopped typing in room: ${room}`);
        }
      } else if (senderId && receiverId) {
        const privateRoomId = getPrivateRoomId(senderId, receiverId);
        if (typingUsers.has(privateRoomId)) {
          typingUsers.get(privateRoomId)!.delete(fullName);
          socket.to(privateRoomId).emit('userStoppedTyping', {
            username: fullName,
            senderId,
            receiverId,
          });
          console.log(`${fullName} stopped typing in private room: ${privateRoomId}`);
        }
      }
    }
  );

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    if (users.has(socket.id)) {
      const { firstName, lastName, currentRoom, userId } = users.get(socket.id)!;
      const fullName = `${firstName} ${lastName}`;
      users.delete(socket.id);

      if (currentRoom) {
        const roomUsers = usersInPublicRooms.get(currentRoom);
        if (roomUsers) {
          roomUsers.delete(fullName);
          io.to(currentRoom).emit('userLeft', {
            username: fullName,
            room: currentRoom,
          });
          console.log(
            `${fullName} disconnected from public room: ${currentRoom}`
          );
        }
        if (typingUsers.has(currentRoom)) {
          typingUsers.get(currentRoom)!.delete(fullName);
          io.to(currentRoom).emit('userStoppedTyping', {
            username: fullName,
            room: currentRoom,
          });
        }
      }
    }

    if (socket.userId && userSockets.has(socket.userId)) {
      userSockets.get(socket.userId)!.delete(socket.id);
      if (userSockets.get(socket.userId)!.size === 0) {
        userSockets.delete(socket.userId);
        // Delete user from globalOnlineUsers map using userId
        if (socket.userId) { // Ensure userId exists before deleting
          globalOnlineUsers.delete(socket.userId);
          io.emit('onlineUsers', Array.from(globalOnlineUsers.values()));
        }
        console.log(
          `User ${socket.firstName} ${socket.lastName || socket.userId} is offline.`
        );
      }
      socket.activeRooms.forEach(room => {
        socket.leave(room);
        if (usersInPublicRooms.has(room)) {
          usersInPublicRooms.get(room)!.delete(`${socket.firstName} ${socket.lastName}`);
        }
        if (usersInPrivateRooms.has(room)) {
          usersInPrivateRooms.get(room)!.delete(socket.userId!);
        }
        if (typingUsers.has(room)) {
          typingUsers.get(room)!.delete(`${socket.firstName} ${socket.lastName}`);
          io.to(room).emit('userStoppedTyping', {
            username: `${socket.firstName} ${socket.lastName}`,
            room,
          });
        }
      });
      console.log(
        `Socket ${socket.id} removed for user ${socket.userId}. Remaining sockets: ${
          userSockets.has(socket.userId)
            ? userSockets.get(socket.userId)!.size
            : 0
        }`
      );
    }
  });
});

connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB for Socket.IO server');
    httpServer.listen(PORT, () => {
      console.log(`Socket.IO server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send(`Socket.IO server is running on port ${PORT}`);
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});