/**
 * Hook for managing Google API state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { GoogleApiManager } from '@/lib/google-api';
import { useToast } from '@/hooks/use-toast';

export interface UseGoogleApiReturn {
  isApiReady: boolean;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => void;
  uploadFile: (blob: Blob, filename: string) => Promise<string>;
}

export function useGoogleApi(): UseGoogleApiReturn {
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const apiManager = GoogleApiManager.getInstance();

  useEffect(() => {
    const initializeApi = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        await apiManager.initialize();
        setIsApiReady(true);
        
        // Check if already signed in
        setIsLoggedIn(apiManager.isSignedIn());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Google API';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Google API Error',
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeApi();
  }, [toast]);

  const signIn = useCallback(async () => {
    try {
      setError(null);
      await apiManager.signIn();
      setIsLoggedIn(true);
      toast({
        title: 'Signed In',
        description: 'Successfully signed in with Google.',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: errorMessage,
      });
    }
  }, [toast]);

  const signOut = useCallback(() => {
    try {
      apiManager.signOut();
      setIsLoggedIn(false);
      toast({
        title: 'Signed Out',
        description: 'Successfully signed out.',
      });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Sign Out Error',
        description: 'Failed to sign out properly.',
      });
    }
  }, [toast]);

  const uploadFile = useCallback(async (blob: Blob, filename: string): Promise<string> => {
    try {
      return await apiManager.uploadFile(blob, filename);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      throw new Error(errorMessage);
    }
  }, []);

  return {
    isApiReady,
    isLoggedIn,
    isLoading,
    error,
    signIn,
    signOut,
    uploadFile,
  };
}