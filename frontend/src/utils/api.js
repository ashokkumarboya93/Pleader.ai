import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${API_URL}/api`;

// Set default axios config
axios.defaults.withCredentials = true;

// Add token to requests
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const chatApi = {
  sendMessage: async (message, chatId = null) => {
    const response = await axios.post(`${API}/chat/send`, {
      message,
      chat_id: chatId
    });
    return response.data;
  },
  
  getHistory: async () => {
    const response = await axios.get(`${API}/chat/history`);
    return response.data;
  },
  
  getChat: async (chatId) => {
    const response = await axios.get(`${API}/chat/${chatId}`);
    return response.data;
  },
  
  deleteChat: async (chatId) => {
    const response = await axios.delete(`${API}/chat/${chatId}`);
    return response.data;
  },
  
  exportChat: async (chatId, format) => {
    const response = await axios.get(`${API}/chat/${chatId}/export/${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const documentApi = {
  analyze: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API}/documents/analyze`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  getDocuments: async () => {
    const response = await axios.get(`${API}/documents`);
    return response.data;
  },
  
  deleteDocument: async (documentId) => {
    const response = await axios.delete(`${API}/documents/${documentId}`);
    return response.data;
  },
  
  exportAnalysis: async (documentId, format) => {
    const response = await axios.get(`${API}/documents/${documentId}/export/${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};

export const ragApi = {
  query: async (query, topK = 3, useRerank = true) => {
    const response = await axios.post(`${API}/rag/query`, {
      query,
      top_k: topK,
      use_rerank: useRerank
    });
    return response.data;
  },
  
  getStats: async () => {
    const response = await axios.get(`${API}/rag/stats`);
    return response.data;
  }
};

export const userApi = {
  updatePreferences: async (preferences) => {
    const response = await axios.put(`${API}/user/preferences`, preferences);
    return response.data;
  }
};

export default {
  chatApi,
  documentApi,
  ragApi,
  userApi
};