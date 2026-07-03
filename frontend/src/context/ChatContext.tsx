import React, { createContext, useContext, useState } from 'react';

// We create a loose context that holds any state we want to share
export const ChatContext = createContext<any>(null);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  // We will move all generic UI states here or simply pass the massive state object from Chat.tsx
  return (
    <ChatContext.Provider value={{}}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChatContext must be used within a ChatProvider');
  return context;
};
