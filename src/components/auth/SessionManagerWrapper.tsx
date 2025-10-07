import React from 'react';
import { useSessionManager } from '@/hooks/useSessionManager';

interface SessionManagerWrapperProps {
  children: React.ReactNode;
}

export const SessionManagerWrapper: React.FC<SessionManagerWrapperProps> = ({ children }) => {
  useSessionManager();
  return <>{children}</>;
};
