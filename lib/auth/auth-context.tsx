'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  PublicClientApplication,
  InteractionStatus,
  AccountInfo,
  AuthenticationResult,
  InteractionRequiredAuthError,
} from '@azure/msal-browser';
import { msalConfig, loginRequest } from './msal-config';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  instance: PublicClientApplication | null;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  logout: async () => {},
  getAccessToken: async () => null,
  instance: null,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [inProgress, setInProgress] = useState<InteractionStatus>(InteractionStatus.None);

  useEffect(() => {
    const initializeMsal = async () => {
      try {
        console.log('Initializing MSAL with config:', {
          clientId: msalConfig.auth.clientId ? 'Set' : 'Not set',
          authority: msalConfig.auth.authority,
          redirectUri: msalConfig.auth.redirectUri,
        });
        
        if (!msalConfig.auth.clientId) {
          console.error('Azure Client ID is not set. Please check your .env.local file.');
          setIsLoading(false);
          return;
        }

        const instance = new PublicClientApplication(msalConfig);
        await instance.initialize();
        setMsalInstance(instance);

        // Check if user is already logged in
        const accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
          setUser(accounts[0]);
          setIsAuthenticated(true);
          console.log('User already authenticated:', accounts[0].username);
        }
      } catch (error) {
        console.error('Failed to initialize MSAL:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMsal();
  }, []);

  const login = async () => {
    if (!msalInstance) {
      console.error('MSAL not initialized');
      return;
    }

    try {
      console.log('Starting login with scopes:', loginRequest.scopes);
      const response = await msalInstance.loginPopup(loginRequest);
      console.log('Login successful:', response.account?.username);
      if (response.account) {
        setUser(response.account);
        setIsAuthenticated(true);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      if (error.errorCode) {
        console.error('Error code:', error.errorCode);
        console.error('Error message:', error.errorMessage);
      }
      throw error;
    }
  };

  const logout = async () => {
    if (!msalInstance || !user) {
      return;
    }

    try {
      await msalInstance.logoutPopup({
        account: user,
      });
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    console.log('getAccessToken called - msalInstance:', !!msalInstance, 'user:', !!user);
    
    if (!msalInstance) {
      console.log('MSAL instance not available');
      return null;
    }
    
    if (!user) {
      console.log('No user logged in');
      return null;
    }

    try {
      const tokenRequest = {
        ...loginRequest,
        account: user,
      };

      console.log('Attempting to acquire token silently...');
      // Try to acquire token silently first
      const response = await msalInstance.acquireTokenSilent(tokenRequest);
      console.log('Token acquired silently');
      return response.accessToken;
    } catch (error) {
      console.log('Silent token acquisition failed, trying popup...');
      if (error instanceof InteractionRequiredAuthError) {
        // Fall back to interactive method if silent acquisition fails
        try {
          const response = await msalInstance.acquireTokenPopup(loginRequest);
          console.log('Token acquired via popup');
          return response.accessToken;
        } catch (popupError) {
          console.error('Failed to acquire token interactively:', popupError);
          return null;
        }
      }
      console.error('Failed to acquire token:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        getAccessToken,
        instance: msalInstance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};