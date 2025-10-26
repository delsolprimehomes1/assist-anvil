import { useState, useEffect } from 'react';

export interface Message {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    carrier?: string;
    section?: string;
  }>;
  regenerated?: boolean;
}

const STORAGE_KEY = 'rag_conversations';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const useConversationHistory = () => {
  const [conversations, setConversations] = useState<Message[]>([]);

  // Load from localStorage on mount and filter old messages
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
        const filtered = parsed.filter((msg: Message) => 
          new Date(msg.timestamp).getTime() > sevenDaysAgo
        ).map((msg: Message) => ({
          ...msg,
          timestamp: new Date(msg.timestamp), // Convert back to Date object
        }));
        setConversations(filtered);
        
        // Update storage if we filtered anything out
        if (filtered.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Save to localStorage whenever conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  const addConversation = (message: Message) => {
    setConversations(prev => [message, ...prev]);
  };

  const updateConversation = (id: string, updates: Partial<Message>) => {
    setConversations(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  const clearHistory = () => {
    setConversations([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(msg => msg.id !== id));
  };

  return { 
    conversations, 
    addConversation, 
    updateConversation,
    clearHistory,
    deleteConversation 
  };
};
