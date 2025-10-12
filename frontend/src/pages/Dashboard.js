import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { chatApi } from '../utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Scale, Menu, X, Plus, Send, Bookmark, Copy, Download, LogOut,
  Settings, HelpCircle, FileText, Mic, Paperclip, Trash2, Search
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const history = await chatApi.getHistory();
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentChat(null);
    setMessages([]);
  };

  const handleLoadChat = async (chatId) => {
    try {
      const chat = await chatApi.getChat(chatId);
      setCurrentChat(chat);
      setMessages(chat.messages || []);
    } catch (error) {
      toast.error('Error loading chat');
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e.stopPropagation();
    try {
      await chatApi.deleteChat(chatId);
      toast.success('Chat deleted');
      setChatHistory(chatHistory.filter(c => c.id !== chatId));
      if (currentChat?.id === chatId) {
        handleNewChat();
      }
    } catch (error) {
      toast.error('Error deleting chat');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      sender: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatApi.sendMessage(inputMessage, currentChat?.id);
      
      setMessages(prev => [...prev, response.ai_message]);
      
      if (!currentChat) {
        setCurrentChat({ id: response.chat_id });
        await loadChatHistory();
      }
    } catch (error) {
      toast.error('Error sending message');
      console.error('Send message error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const quickPrompts = [
    "Draft a legal notice",
    "Explain property law",
    "Analyze a contract",
    "Indian Constitution rights"
  ];

  return (
    <div className="flex h-screen bg-gray-50" data-testid="dashboard">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Scale className="w-6 h-6 text-green-500" />
              <span className="font-bold text-gray-900">Pleader AI</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <Button
            onClick={handleNewChat}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
            data-testid="new-chat-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="bg-green-100 text-green-700">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search chats..."
                className="pl-9 h-9 text-sm"
                data-testid="search-chats"
              />
            </div>
          </div>
          
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Chats</h3>
          <div className="space-y-1">
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleLoadChat(chat.id)}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer group ${
                  currentChat?.id === chat.id ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
                }`}
                data-testid={`chat-item-${chat.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{chat.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(chat.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded"
                  data-testid={`delete-chat-${chat.id}`}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <button
            onClick={() => navigate('/analyze')}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            data-testid="analyze-docs-link"
          >
            <FileText className="w-5 h-5" />
            <span>Analyze Documents</span>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            data-testid="settings-link"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => navigate('/help')}
            className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            data-testid="help-link"
          >
            <HelpCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col" data-testid="chat-area">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} data-testid="open-sidebar-button">
                <Menu className="w-6 h-6 text-gray-700" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900">
              {currentChat ? 'Chat' : 'New Chat'}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            {currentChat && messages.length > 0 && (
              <div className="relative group">
                <Button variant="ghost" size="sm" className="text-gray-600" data-testid="export-button">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExportChat('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    data-testid="export-pdf"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => handleExportChat('docx')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    data-testid="export-docx"
                  >
                    Export as DOCX
                  </button>
                  <button
                    onClick={() => handleExportChat('txt')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
                    data-testid="export-txt"
                  >
                    Export as TXT
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="messages-container">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <Scale className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Pleader AI</h2>
                <p className="text-gray-600 mb-6">
                  Your personal legal assistant. Ask me anything about Indian law, or upload documents for analysis.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt)}
                      className="px-4 py-2 text-sm bg-green-50 hover:bg-green-100 text-green-700 rounded-lg border border-green-200"
                      data-testid={`quick-prompt-${index}`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  data-testid={`message-${index}`}
                >
                  <div className={`flex space-x-3 max-w-3xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <Avatar className="flex-shrink-0">
                      {message.sender === 'user' ? (
                        <AvatarFallback className="bg-green-500 text-white">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      ) : (
                        <AvatarFallback className="bg-gray-200">
                          <Scale className="w-5 h-5 text-green-600" />
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className={`flex-1 ${message.sender === 'user' ? 'text-right' : ''}`}>
                      <div
                        className={`inline-block p-4 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-green-500 text-white'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                      {message.sender === 'ai' && (
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => handleCopyMessage(message.content)}
                            className="p-1 hover:bg-gray-100 rounded"
                            data-testid={`copy-message-${index}`}
                          >
                            <Copy className="w-4 h-4 text-gray-500" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Bookmark className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start animate-fade-in">
                  <div className="flex space-x-3 max-w-3xl">
                    <Avatar>
                      <AvatarFallback className="bg-gray-200">
                        <Scale className="w-5 h-5 text-green-600" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask me anything about Indian law..."
                  className="h-12 pr-24 resize-none"
                  disabled={loading}
                  data-testid="message-input"
                />
                <div className="absolute right-16 bottom-7 flex space-x-1">
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded"
                    data-testid="attach-file-button"
                  >
                    <Paperclip className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded"
                    data-testid="voice-input-button"
                  >
                    <Mic className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="bg-green-500 hover:bg-green-600 text-white h-12 px-6"
                data-testid="send-button"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
