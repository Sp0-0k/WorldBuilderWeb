import React, { createContext, useContext, useEffect, useState } from 'react';

interface DebugContextValue {
  debugMode: boolean;
  setDebugMode: (value: boolean) => void;
}

const DebugContext = createContext<DebugContextValue>({
  debugMode: false,
  setDebugMode: () => {},
});

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [debugMode, setDebugModeState] = useState<boolean>(
    () => localStorage.getItem('wbw_debug_mode') === 'true'
  );

  const setDebugMode = (value: boolean) => {
    setDebugModeState(value);
    localStorage.setItem('wbw_debug_mode', String(value));
  };

  return (
    <DebugContext.Provider value={{ debugMode, setDebugMode }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => useContext(DebugContext);
