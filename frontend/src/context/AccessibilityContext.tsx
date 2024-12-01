import React, { createContext, useContext, useState } from 'react';

interface AccessibilityContextType {
  announceMessage: (message: string) => void;
  lastAnnouncement: string;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [lastAnnouncement, setLastAnnouncement] = useState('');

  const announceMessage = (message: string) => {
    setLastAnnouncement(message);
  };

  return (
    <AccessibilityContext.Provider value={{ announceMessage, lastAnnouncement }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {lastAnnouncement}
      </div>
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};