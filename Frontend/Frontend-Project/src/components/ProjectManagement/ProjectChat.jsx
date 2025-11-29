import React, { useState, useEffect, useRef } from 'react';
import { useLocalSession } from '../../hooks/useLocalSession.js';
import toast from 'react-hot-toast';

const ProjectChat = ({ projectId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const { currentUser } = useLocalSession();

  useEffect(() => {
    fetchMessages();
    // Set up polling for new messages (in a real app, use WebSockets)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/chats/project/${projectId}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;

    setSending(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chats/project/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          message: newMessage.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setNewMessage('');
      fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="text-gray-400 mt-2">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-96">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-800/20 rounded-lg p-4 border border-gray-700/50 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md rounded-lg p-3 ${
                    message.user_id === currentUser?.id
                      ? 'bg-blue-500/20 border border-blue-500/30'
                      : 'bg-gray-700/50 border border-gray-600/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${
                      message.user_id === currentUser?.id ? 'text-blue-300' : 'text-gray-300'
                    }`}>
                      {message.username}
                    </span>
                    {message.user_type === 0 && (
                      <span className="text-xs bg-red-500/20 text-red-300 px-1 rounded">Admin</span>
                    )}
                    {message.user_type <= 3 && message.user_type > 0 && (
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-1 rounded">Senior</span>
                    )}
                  </div>
                  <p className="text-white text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.user_id === currentUser?.id ? 'text-blue-400' : 'text-gray-400'
                  }`}>
                    {formatTime(message.sent_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          disabled={sending || !currentUser}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending || !currentUser}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
        >
          {sending ? '...' : 'Send'}
        </button>
      </form>

      {!currentUser && (
        <p className="text-center text-gray-400 text-sm mt-2">
          Please log in to participate in the chat
        </p>
      )}
    </div>
  );
};

export default ProjectChat;