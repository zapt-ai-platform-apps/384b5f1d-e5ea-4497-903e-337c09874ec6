import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';

export default function AuthScreen() {
  return (
    <div className="max-w-md mx-auto card p-8">
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-800">
        Welcome to Contract Assistant
      </h1>
      
      <div className="text-center mb-6">
        <p className="text-lg font-medium mb-2">
          Sign in with ZAPT
        </p>
        <a 
          href="https://www.zapt.ai" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 transition"
        >
          www.zapt.ai
        </a>
      </div>
      
      <Auth
        supabaseClient={supabase}
        appearance={{ 
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3b82f6',
                brandAccent: '#2563eb'
              }
            }
          }
        }}
        providers={['google', 'facebook', 'apple']}
        magicLink={true}
        view="magic_link"
        redirectTo={window.location.origin}
        socialLayout="horizontal"
      />
    </div>
  );
}