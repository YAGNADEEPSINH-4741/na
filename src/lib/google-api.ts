/**
 * Google API utilities for Drive integration
 */

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export interface GoogleApiState {
  isApiReady: boolean;
  isLoggedIn: boolean;
  error: string | null;
}

export class GoogleApiManager {
  private static instance: GoogleApiManager;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  static getInstance(): GoogleApiManager {
    if (!GoogleApiManager.instance) {
      GoogleApiManager.instance = new GoogleApiManager();
    }
    return GoogleApiManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doInitialize();
    return this.initPromise;
  }

  private async doInitialize(): Promise<void> {
    try {
      // Check if credentials are available
      if (!CLIENT_ID || !API_KEY) {
        throw new Error('Google API credentials not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY in your .env.local file.');
      }

      // Wait for scripts to be available
      await this.waitForScripts();
      
      // Initialize GAPI
      await this.initializeGapi();
      
      // Initialize GSI
      await this.initializeGsi();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google APIs:', error);
      throw new Error('Google API initialization failed');
    }
  }

  private waitForScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Google API scripts failed to load'));
      }, 10000);

      const checkScripts = () => {
        if (typeof window !== 'undefined' && window.gapi && window.google?.accounts?.oauth2) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkScripts, 100);
        }
      };

      checkScripts();
    });
  }

  private initializeGapi(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('GAPI not available'));
        return;
      }

      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          resolve();
        } catch (error) {
          console.error('GAPI client initialization error details:', error);
          if (error instanceof Error) {
            reject(new Error(`Failed to initialize GAPI client: ${error.message}`));
          } else {
            reject(new Error(`Failed to initialize GAPI client: ${JSON.stringify(error)}`));
          }
        }
      });
    });
  }

  private initializeGsi(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!window.google?.accounts?.oauth2) {
          reject(new Error('Google Identity Services not available'));
          return;
        }

        this.tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              window.gapi.client.setToken({ access_token: tokenResponse.access_token });
            }
          },
          error_callback: (error: any) => {
            console.error('GSI Error:', error);
          }
        });

        resolve();
      } catch (error) {
        reject(new Error('Failed to initialize Google Identity Services'));
      }
    });
  }

  async signIn(): Promise<void> {
    if (!this.tokenClient) {
      throw new Error('Google API not initialized');
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not available'));
        return;
      }

      const originalCallback = this.tokenClient.callback;
      this.tokenClient.callback = (tokenResponse: any) => {
        if (originalCallback) originalCallback(tokenResponse);
        if (tokenResponse && tokenResponse.access_token) {
          resolve();
        } else {
          reject(new Error('Failed to get access token'));
        }
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  signOut(): void {
    if (window.gapi?.client) {
      const token = window.gapi.client.getToken();
      if (token) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {});
      }
      window.gapi.client.setToken(null);
    }
  }

  isSignedIn(): boolean {
    return !!(window.gapi?.client?.getToken()?.access_token);
  }

  async uploadFile(blob: Blob, filename: string): Promise<string> {
    if (!this.isSignedIn()) {
      throw new Error('Not signed in');
    }

    const metadata = {
      name: filename,
      mimeType: blob.type,
    };

    const formBody = new FormData();
    formBody.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formBody.append('file', blob);

    const token = window.gapi.client.getToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.access_token}`
      },
      body: formBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${errorText}`);
    }

    const driveFile = await response.json();

    // Make file public
    await window.gapi.client.drive.permissions.create({
      fileId: driveFile.id,
      resource: { role: 'reader', type: 'anyone' }
    });

    // Get public link
    const fileDetails = await window.gapi.client.drive.files.get({
      fileId: driveFile.id,
      fields: 'webViewLink'
    });

    const publicLink = fileDetails.result.webViewLink;
    if (!publicLink) {
      throw new Error('Could not retrieve public link');
    }

    return publicLink;
  }
}