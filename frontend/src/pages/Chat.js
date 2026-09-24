import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Chat.css';

const Chat = () => {
  const { otherUserId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (otherUserId) {
      loadConversation(otherUserId);
    }
  }, [otherUserId]);

  useEffect(() => {
    if (socket && selectedConversation) {
      socket.emit('join_conversation', selectedConversation.conversationId);

      socket.on('receive_message', (message) => {
        if (message.conversationId === selectedConversation.conversationId) {
          setMessages(prev => [...prev, message]);
          scrollToBottom();
        }
      });

      return () => {
        socket.off('receive_message');
      };
    }
  }, [socket, selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.data.conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (userId) => {
    try {
      const response = await chatAPI.getMessages(userId);
      setMessages(response.data.messages);
      setSelectedConversation({
        conversationId: response.data.conversationId,
        otherUser: response.data.otherUser
      });
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);

    const messageData = {
      conversationId: selectedConversation.conversationId,
      senderId: user.id,
      receiverId: selectedConversation.otherUser._id,
      message: newMessage,
      productId: location.state?.product?._id
    };

    try {
      if (socket && isConnected) {
        socket.emit('send_message', messageData);
        setNewMessage('');
      } else {
        const response = await chatAPI.sendMessage({
          receiverId: selectedConversation.otherUser._id,
          message: newMessage,
          productId: location.state?.product?._id
        });
        setMessages([...messages, response.data.data]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="container">
        <div className="chat-container">
          {/* Conversations List */}
          <div className="conversations-sidebar">
            <div className="sidebar-header">
              <h2>Messages</h2>
              <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢' : '🔴'}
              </span>
            </div>

            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <p>No conversations yet</p>
                <p className="hint">Start chatting with sellers!</p>
              </div>
            ) : (
              <div className="conversations-list">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    className={`conversation-item ${
                      selectedConversation?.conversationId === conv.conversationId ? 'active' : ''
                    }`}
                    onClick={() => loadConversation(conv.otherUser._id)}
                  >
                    <div className="conversation-avatar">
                      {conv.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="conversation-info">
                      <div className="conversation-header">
                        <span className="conversation-name">{conv.otherUser.name}</span>
                        <span className="conversation-time">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <p className="conversation-last-message">{conv.lastMessage}</p>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chat Area */}
          <div className="chat-area">
            {selectedConversation ? (
              <>
                <div className="chat-header">
                  <div className="chat-user-info">
                    <div className="chat-avatar">
                      {selectedConversation.otherUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3>{selectedConversation.otherUser.name}</h3>
                      <p>{selectedConversation.otherUser.email}</p>
                    </div>
                  </div>
                </div>

                <div className="messages-container">
                  {messages.length === 0 ? (
                    <div className="empty-messages">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`message ${
                          msg.sender._id === user.id ? 'sent' : 'received'
                        }`}
                      >
                        <div className="message-content">
                          <p>{msg.message}</p>
                          <span className="message-time">{formatTime(msg.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="message-input-form">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sending || !newMessage.trim()}
                  >
                    {sending ? '...' : '📤'}
                  </button>
                </form>
              </>
            ) : (
              <div className="no-conversation-selected">
                <div className="empty-icon">💬</div>
                <h3>Select a conversation</h3>
                <p>Choose a conversation from the list to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
