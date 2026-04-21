import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import chatbot from '../assets/Chatbot.png';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi! I am Mediport chatbot. How can I assist you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll to the bottom of the chat when new messages arrive or the window opens
    useEffect(() => {
        if (isOpen) {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Updated to use the chat route in your backend
            const response = await axios.post('http://localhost:5000/api/chat', { message: input });
            setMessages(prev => [...prev, { role: 'model', text: response.data.reply }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: "Server error. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <style>
                {`
                .chatbot-wrapper {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 1000;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                /* Minimized State (The Button) */
                .chatbot-toggle-btn {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background-color: #4485d1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: transform 0.2s ease;
                }

                /* Fix: Proportional icon sizing for the toggle button */
                .chatbot-toggle-btn img {
                    width: 65%; 
                    height: 65%;
                    object-fit: contain;
                }

                .chatbot-toggle-btn:hover {
                    transform: scale(1.05);
                }

                /* Expanded State (The Window) */
                .chatbot-container {
                    display: flex;
                    flex-direction: column;
                    height: 550px;
                    width: 350px;
                    border-radius: 20px;
                    background-color: #f0f4f9;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                    overflow: hidden;
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .chatbot-header {
                    background-color: #4485d1;
                    padding: 15px;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                }

                .bot-icon-circle {
                    background: white;
                    border-radius: 50%;
                    width: 35px;
                    height: 35px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                /* Fix: Proportional icon sizing for the header icon */
                .bot-icon-circle img {
                    width: 70%;
                    height: 70%;
                    object-fit: contain;
                }

                .message-area {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }

                .message {
                    max-width: 85%;
                    padding: 12px 16px;
                    font-size: 14px;
                    line-height: 1.5;
                }

                .message.model {
                    align-self: flex-start;
                    background-color: #b4d4ff;
                    color: #333;
                    border-radius: 18px 18px 18px 0;
                }

                .message.user {
                    align-self: flex-end;
                    background-color: #ffffff;
                    color: #444;
                    border-radius: 18px 18px 0 18px;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
                }

                .input-container {
                    padding: 10px 15px;
                    background: white;
                    margin: 0 15px 15px 15px;
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                }

                .chat-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    font-size: 14px;
                    padding: 5px;
                }

                .send-button {
                    background: none;
                    border: none;
                    color: #4485d1;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                }

                .loading-indicator {
                    font-size: 12px;
                    color: #4485d1;
                    font-style: italic;
                    margin-left: 5px;
                }
                `}
            </style>

            <div className="chatbot-wrapper">
                {!isOpen ? (
                    /* Minimized Button View */
                    <div className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
                        <img src={chatbot} alt="Open Chat" />
                    </div>
                ) : (
                    /* Full Chat Window View */
                    <div className="chatbot-container">
                        <div className="chatbot-header" onClick={() => setIsOpen(false)}>
                            <span>Mediport chatbot</span>
                            <div className="bot-icon-circle">
                                <img src={chatbot} alt="Bot Icon" />
                            </div>
                        </div>

                        <div className="message-area">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.role}`}>
                                    {msg.text}
                                </div>
                            ))}
                            {isLoading && <div className="loading-indicator">Mediport is checking logs...</div>}
                            <div ref={scrollRef} />
                        </div>

                        <div className="input-container">
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                <input
                                    className="chat-input"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Mediport a question"
                                    disabled={isLoading}
                                />
                                <button type="submit" className="send-button" disabled={isLoading}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Chatbot;