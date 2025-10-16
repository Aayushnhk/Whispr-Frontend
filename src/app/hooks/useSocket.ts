import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocketContext } from '@/context/SocketContext';
import { Message, User, OnlineUser } from '@/types';
import { Socket } from 'socket.io-client';

interface UseSocketProps {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  currentRoom?: string;
  isPrivateChat: boolean;
  receiverId?: string | null;
  receiverFirstName?: string | null;
  receiverLastName?: string | null;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

interface UseSocketReturn {
  socket: typeof Socket | null;
  onlineUsers: OnlineUser[];
  typingUsers: string[];
  clearTypingStatus: () => void;
  isTypingRef: React.MutableRefObject<boolean>;
  typingTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

const useSocket = ({
  user,
  isAuthenticated,
  authLoading,
  currentRoom,
  isPrivateChat,
  receiverId,
  receiverFirstName,
  receiverLastName,
  setMessages,
}: UseSocketProps): UseSocketReturn => {
  const { socket, onlineUsers } = useSocketContext();

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const isTypingRef = useRef<boolean>(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const normalizeMessage = useCallback(
    (message: any): Message => {
      const extractedSenderFirstName = message.senderFirstName || message.sender?.firstName || '';
      const extractedSenderLastName = message.senderLastName || message.sender?.lastName || '';
      const extractedReceiverFirstName = message.receiverFirstName || message.receiver?.firstName || '';
      const extractedReceiverLastName = message.receiverLastName || message.receiver?.lastName || '';

      return {
        id: message.id || message._id?.toString() || Date.now().toString(),
        _id: message._id?.toString(),
        sender:
          extractedSenderFirstName && extractedSenderLastName
            ? `${extractedSenderFirstName} ${extractedSenderLastName}`
            : message.senderUsername || message.sender || 'Unknown',
        senderId:
          message.senderId ||
          message.sender?._id?.toString() ||
          message.sender?.toString() ||
          '',
        text: message.text || message.content || undefined,
        timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
        room: message.room || undefined,
        chatType: message.chatType || (isPrivateChat ? 'private' : 'room'),
        receiverId:
          message.receiverId ||
          message.receiver?._id?.toString() ||
          message.receiver?.toString() ||
          undefined,
        receiver:
          extractedReceiverFirstName && extractedReceiverLastName
            ? `${extractedReceiverFirstName} ${extractedReceiverLastName}`
            : message.receiverUsername || undefined,
        receiverFirstName: extractedReceiverFirstName || undefined,
        receiverLastName: extractedReceiverLastName || undefined,
        isEdited: message.isEdited || false,
        fileUrl: message.fileUrl || undefined,
        fileType: message.fileType || undefined,
        fileName: message.fileName || undefined,
        replyTo: message.replyTo
          ? {
              id: message.replyTo.id || message.replyTo._id?.toString(),
              sender: message.replyTo.sender || 'Unknown',
              text: message.replyTo.text || undefined,
              fileUrl: message.replyTo.fileUrl || undefined,
              fileType: message.replyTo.fileType || undefined,
              fileName: message.replyTo.fileName || undefined,
            }
          : undefined,
      };
    },
    [isPrivateChat]
  );

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!socket || !user) return;

    if (isPrivateChat && receiverId) {
      if (isTyping) {
        socket.emit('typing', {
          senderId: user.id,
          receiverId,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      } else {
        socket.emit('stopTyping', {
          senderId: user.id,
          receiverId,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      }
    } else if (currentRoom) {
      if (isTyping) {
        socket.emit('typing', {
          room: currentRoom,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      } else {
        socket.emit('stopTyping', {
          room: currentRoom,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      }
    }
  }, [socket, user, currentRoom, isPrivateChat, receiverId]);

  const clearTypingStatus = useCallback(() => {
    if (isTypingRef.current && user) {
      sendTypingStatus(false);
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(`${user.firstName} ${user.lastName}`);
        return newSet;
      });
      isTypingRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [user, sendTypingStatus]);

  const handleReceiveMessage = useCallback(
    (message: any) => {
      const normalizedMessage = normalizeMessage(message);

      setMessages((prevMessages) => {
        const existingIndex = prevMessages.findIndex(
          (msg) =>
            msg.id === normalizedMessage.id ||
            (normalizedMessage._id && msg._id === normalizedMessage._id)
        );

        if (existingIndex > -1) {
          const updatedMessages = [...prevMessages];
          updatedMessages[existingIndex] = normalizedMessage;
          return updatedMessages;
        } else {
          const isRelevantPublicMessage = normalizedMessage.chatType === 'room' && normalizedMessage.room === currentRoom;
          const isRelevantPrivateMessage = normalizedMessage.chatType === 'private' &&
            ((normalizedMessage.senderId === user?.id && normalizedMessage.receiverId === receiverId) ||
             (normalizedMessage.senderId === receiverId && normalizedMessage.receiverId === user?.id));
          
          if (isRelevantPublicMessage || isRelevantPrivateMessage) {
            return [...prevMessages, normalizedMessage];
          }
          return prevMessages;
        }
      });
    },
    [normalizeMessage, user, currentRoom, setMessages, receiverId]
  );

  useEffect(() => {
    if (!socket || !user || !isAuthenticated || authLoading) {
      return;
    }

    if (isPrivateChat && receiverId && receiverFirstName && receiverLastName) {
      socket.emit(
        'joinPrivateRoom',
        {
          senderId: user.id,
          senderFirstName: user.firstName,
          senderLastName: user.lastName,
          receiverId,
          receiverFirstName,
          receiverLastName,
        },
        (response: any) => {
          if (response.success && user.id) {
            socket.emit('getPrivateMessages', {
              user1Id: user.id,
              user2Id: receiverId,
            });
          }
        }
      );
    } else if (currentRoom) {
      socket.emit('joinRoom', currentRoom, user.id, user.firstName, user.lastName);
    }

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('receivePrivateMessage', handleReceiveMessage);
    socket.on('historicalPrivateMessages', (historicalMessages: any[]) => {
      setMessages(historicalMessages.map(normalizeMessage));
    });
    
    socket.on('userTyping', ({ username, senderId, receiverId: typingReceiverId, room }: {
      username: string; senderId?: string; receiverId?: string; room?: string;
    }) => {
      const isPrivateTypingForMe = isPrivateChat && user?.id === typingReceiverId && senderId === receiverId;
      const isPublicTypingForRoom = !isPrivateChat && room === currentRoom && username !== `${user?.firstName} ${user?.lastName}`;

      if (isPrivateTypingForMe || isPublicTypingForRoom) {
        setTypingUsers((prev) => new Set(prev).add(username));
      }
    });

    socket.on('userStoppedTyping', ({ username, senderId, receiverId: typingReceiverId, room }: {
      username: string; senderId?: string; receiverId?: string; room?: string;
    }) => {
      const isPrivateStoppedTypingForMe = isPrivateChat && user?.id === typingReceiverId && senderId === receiverId;
      const isPublicStoppedTypingForRoom = !isPrivateChat && room === currentRoom;

      if (isPrivateStoppedTypingForMe || isPublicStoppedTypingForRoom) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(username);
          return newSet;
        });
      }
    });

    socket.on('messageEdited', (updatedMessage: any) =>
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id
            ? normalizeMessage({ ...msg, text: updatedMessage.text, isEdited: true })
            : msg
        )
      )
    );
    socket.on('messageDeleted', ({ messageId }: { messageId: string }) =>
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId))
    );
    socket.on('messageError', (error: string) => {});

    return () => {
      if (socket) {
        socket.off('receiveMessage', handleReceiveMessage);
        socket.off('receivePrivateMessage', handleReceiveMessage);
        socket.off('historicalPrivateMessages');
        socket.off('userTyping');
        socket.off('userStoppedTyping');
        socket.off('messageEdited');
        socket.off('messageDeleted');
        socket.off('messageError');

        if (isPrivateChat && receiverId && user?.id) {
          socket.emit('leavePrivateRoom', {
            senderId: user.id,
            receiverId,
          });
        } else if (currentRoom && user?.id) {
          socket.emit('leaveRoom', currentRoom, user.id, user.firstName, user.lastName);
        }
        clearTypingStatus();
      }
    };
  }, [
    socket,
    user,
    isAuthenticated,
    authLoading,
    currentRoom,
    isPrivateChat,
    receiverId,
    receiverFirstName,
    receiverLastName,
    handleReceiveMessage,
    normalizeMessage,
    setMessages,
    clearTypingStatus,
  ]);

  return {
    socket,
    onlineUsers,
    typingUsers: Array.from(typingUsers),
    clearTypingStatus,
    isTypingRef,
    typingTimeoutRef,
  };
};

export default useSocket;