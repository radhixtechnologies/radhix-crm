import { useState, useEffect, useRef } from 'react';
import { FiMessageCircle, FiX, FiSend, FiUser } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import '../../styles/sales/chat-modal.css';

const ChatModal = ({ isOpen, onClose, lead }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            loadMessages();
        }
    }, [isOpen, lead._id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        try {
            setLoading(true);
            // In production, this would fetch actual messages from the backend
            // For now, we'll simulate with communication history
            const response = await salesService.getLead(lead._id);

            // Extract communication history and format as messages
            const communications = response.data.data.communications || [];
            const formattedMessages = communications
                .filter(comm => comm.type === 'message' || comm.type === 'note')
                .map(comm => ({
                    id: comm._id,
                    text: comm.notes || comm.message,
                    sender: comm.createdBy?.name || 'System',
                    timestamp: comm.timestamp || comm.createdAt,
                    isOwn: false // In production, check if current user sent it
                }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const tempMessage = {
            id: Date.now(),
            text: newMessage,
            sender: 'You',
            timestamp: new Date(),
            isOwn: true
        };

        setMessages([...messages, tempMessage]);
        setNewMessage('');

        try {
            // Log as communication
            await salesService.addCommunication(lead._id, {
                type: 'message',
                direction: 'outbound',
                notes: newMessage,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
            // Remove the temp message on error
            setMessages(messages.filter(m => m.id !== tempMessage.id));
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <div className="modal-icon-box chat">
                            <FiMessageCircle size={20} />
                        </div>
                        <div>
                            <h2 className="modal-title">Chat with {lead.name}</h2>
                            <p className="modal-subtitle">{lead.company || 'Lead'}</p>
                        </div>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className="modal-body chat-body">
                    <div className="messages-container">
                        {loading ? (
                            <div className="chat-loading">Loading messages...</div>
                        ) : messages.length === 0 ? (
                            <div className="chat-empty-state">
                                <FiMessageCircle size={48} />
                                <p>No messages yet</p>
                                <span>Start a conversation with {lead.name}</span>
                            </div>
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.isOwn ? 'message-own' : 'message-other'}`}
                                    >
                                        {!msg.isOwn && (
                                            <div className="message-avatar">
                                                <FiUser size={16} />
                                            </div>
                                        )}
                                        <div className="message-content">
                                            {!msg.isOwn && (
                                                <div className="message-sender">{msg.sender}</div>
                                            )}
                                            <div className="message-bubble">
                                                {msg.text}
                                            </div>
                                            <div className="message-time">
                                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className="chat-input-container">
                        <textarea
                            className="chat-input"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            rows="1"
                        />
                        <button
                            className="btn-send-message"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                        >
                            <FiSend size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatModal;
