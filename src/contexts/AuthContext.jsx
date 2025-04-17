import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, recordLogin } from '../supabaseClient';
import * as Sentry from '@sentry/browser';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRecordedLogin, setHasRecordedLogin] = useState(false);
  const hasSessionRef = useRef(false);

  // Update session and ref together
  const updateSession = (newSession) => {
    setSession(newSession);
    hasSessionRef.current = newSession !== null;
  };

  useEffect(() => {
    // Check active session on initial mount
    const checkSession = async () => {
      try {
        console.log('Checking auth session...');
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        // Set initial session
        updateSession(data.session);
        if (data.session) {
          setUser(data.session.user);
          hasSessionRef.current = true;
          console.log('User is already logged in:', data.session.user.email);
        } else {
          console.log('No active session found');
        }
        setLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        Sentry.captureException(error);
        setLoading(false);
      }
    };
    
    checkSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('Auth event:', event, 'Has session:', hasSessionRef.current);
      
      // For SIGNED_IN, only update session if we don't have one
      if (event === 'SIGNED_IN') {
        if (!hasSessionRef.current) {
          updateSession(newSession);
          setUser(newSession?.user || null);
          console.log('User signed in:', newSession?.user?.email);
        } else {
          console.log('Already have session, ignoring SIGNED_IN event');
        }
      }
      // For TOKEN_REFRESHED, always update the session
      else if (event === 'TOKEN_REFRESHED') {
        updateSession(newSession);
        setUser(newSession?.user || null);
        console.log('Token refreshed for user:', newSession?.user?.email);
      }
      // For SIGNED_OUT, clear the session
      else if (event === 'SIGNED_OUT') {
        updateSession(null);
        setUser(null);
        setHasRecordedLogin(false);
        console.log('User signed out');
      }
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  // Record login when user is authenticated
  useEffect(() => {
    if (session?.user?.email && !hasRecordedLogin) {
      try {
        console.log('Recording login for:', session.user.email);
        recordLogin(session.user.email, import.meta.env.VITE_PUBLIC_APP_ENV);
        setHasRecordedLogin(true);
      } catch (error) {
        console.error('Failed to record login:', error);
        Sentry.captureException(error);
      }
    }
  }, [session, hasRecordedLogin]);

  const signOut = async () => {
    try {
      console.log('Signing out user');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      Sentry.captureException(error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}