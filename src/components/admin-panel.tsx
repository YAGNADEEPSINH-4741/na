
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useNews } from '@/hooks/use-news';
import { type NewsArticle } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, LogIn, LogOut, FileUp } from 'lucide-react';

const CLIENT_ID = "850316948462-o5aip3c43p343l4aksg3fn02pcjcqqaa.apps.googleusercontent.com";
const API_KEY = "AIzaSyBzTH1f_pjyoGLKA9GM2J9Y5VPg0K33nVQ";
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }).max(100),
  description: z.string().min(20, { message: "Description must be at least 20 characters long." }),
  layout: z.enum(['1-block', '2-block', '3-block']),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: "Please enter a valid E.164 phone number." }),
});

const phoneNumbers = [
  { label: 'Emergency Broadcast', value: '+15550001111' },
  { label: 'Local News Desk', value: '+15552223333' },
  { label: 'Editor-in-Chief', value: '+15554445555' },
];

export default function AdminPanel() {
  const { toast } = useToast();
  const { addArticle } = useNews();
  const [isApiReady, setIsApiReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [tokenClient, setTokenClient] = useState<google.accounts.oauth2.TokenClient | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      layout: '1-block',
      phone: phoneNumbers[0].value,
    },
  });
  
  const gapiLoaded = useCallback(() => {
    if (!window.gapi) {
      console.error("GAPI script loaded but window.gapi not defined.");
      toast({
        variant: "destructive",
        title: "Google API Error",
        description: "GAPI client failed to load. Please refresh and try again.",
      });
      return;
    }
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        setIsApiReady(true);
      } catch (error) {
        console.error("Error initializing GAPI client", error);
        toast({
          variant: "destructive",
          title: "Google API Error",
          description: "Could not initialize Google API client.",
        });
      }
    });
  }, [toast]);

  const gsiLoaded = useCallback(() => {
    try {
      if (!window.google?.accounts?.oauth2) {
        throw new Error("Google Identity Services not available.");
      }
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (tokenResponse) => {
          if (tokenResponse && tokenResponse.access_token) {
            window.gapi.client.setToken({ access_token: tokenResponse.access_token });
            setIsLoggedIn(true);
            toast({ title: 'Signed In', description: 'You are now signed in with Google.' });
          }
        },
        error_callback: (error) => {
          console.error('GSI Error:', error);
          toast({
            variant: 'destructive',
            title: 'Google Sign-In Error',
            description: 'Failed to sign in. Please try again.',
          });
        }
      });
      setTokenClient(client);
    } catch (error) {
       console.error("Error initializing GSI client", error);
       toast({
          variant: "destructive",
          title: "Google Sign-In Error",
          description: "Could not initialize Google Sign-In.",
        });
    }
  }, [toast]);

  useEffect(() => {
    const loadScript = (src: string, id: string, onLoad: () => void, onError: () => void) => {
      if (document.getElementById(id)) {
        onLoad();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.id = id;
      script.async = true;
      script.defer = true;
      script.onload = onLoad;
      script.onerror = onError;
      document.body.appendChild(script);
    };

    const handleGapiError = () => {
        console.error("Failed to load the Google API script.");
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Could not load necessary Google scripts. Please check your connection and try again.",
        });
    };

    const handleGsiError = () => {
        console.error("Failed to load the Google Sign-In script.");
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Could not load necessary Google Sign-In scripts. Please check your connection and try again.",
        });
    };

    loadScript('https://accounts.google.com/gsi/client', 'google-gsi-script', gsiLoaded, handleGsiError);
    loadScript('https://apis.google.com/js/api.js', 'google-api-script', gapiLoaded, handleGapiError);

  }, [gsiLoaded, gapiLoaded, toast]);


  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
  }, []);

  const handleAuthClick = () => {
    if (isLoggedIn) {
        if (window.gapi && window.gapi.client) {
            const token = window.gapi.client.getToken();
            if (token) {
                google.accounts.oauth2.revoke(token.access_token, () => {});
            }
            window.gapi.client.setToken(null);
        }
        setIsLoggedIn(false);
        toast({ title: "Signed Out", description: "You have been signed out." });
    } else if (tokenClient) {
      tokenClient.requestAccessToken({prompt: 'consent'});
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isLoggedIn) {
      toast({ variant: 'destructive', title: 'Not Logged In', description: 'Please log in with Google to publish articles.' });
      return;
    }
    if (typeof html2pdf === 'undefined') {
        toast({ variant: 'destructive', title: 'Error', description: 'PDF generation library not loaded.' });
        return;
    }

    setIsPublishing(true);
    
    try {
      const pdfElement = articleRef.current;
      if (!pdfElement) throw new Error("Article content not found for PDF generation.");
      
      pdfElement.style.left = '0';
      const pdfBlob = await html2pdf().from(pdfElement).output('blob');
      pdfElement.style.left = '-9999px';


      const metadata = {
        name: `${values.title.replace(/ /g, '_')}_${Date.now()}.pdf`,
        mimeType: 'application/pdf',
      };
      
      const formBody = new FormData();
      formBody.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formBody.append('file', pdfBlob);
      
      const token = window.gapi.client.getToken();
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': `Bearer ${token.access_token}` }),
        body: formBody,
      });

      if (!res.ok) throw new Error(`Google Drive upload failed: ${await res.text()}`);
      const driveFile = await res.json();

      await window.gapi.client.drive.permissions.create({
        fileId: driveFile.id,
        resource: { role: 'reader', type: 'anyone' }
      });

      const fileDetails = await window.gapi.client.drive.files.get({
        fileId: driveFile.id,
        fields: 'webViewLink'
      });
      const publicLink = fileDetails.result.webViewLink;
      if (!publicLink) throw new Error("Could not retrieve public link.");

      const newArticle: NewsArticle = {
        id: new Date().toISOString(),
        ...values,
        createdAt: Date.now(),
        pdfLink: publicLink,
      };
      addArticle(newArticle);

      console.log(`[SIMULATION] Triggering SMS to ${values.phone} with link: ${publicLink}`);
      toast({ title: "SMS Sent (Simulated)", description: `Notification sent to ${values.phone}.` });

      toast({ title: 'Article Published!', description: 'Your new article is live.' });
      form.reset();

    } catch (error: any) {
      console.error("Publishing error:", error);
      toast({ variant: 'destructive', title: 'Publishing Failed', description: error.message || 'An unknown error occurred.' });
    } finally {
      setIsPublishing(false);
    }
  };
  
  const watchedValues = form.watch();

  return (
    <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <CardTitle className="font-headline text-3xl text-primary">News Editor</CardTitle>
                    <CardDescription>Create, generate a PDF, and publish a new article.</CardDescription>
                </div>
                <Button onClick={handleAuthClick} disabled={!isApiReady} variant="outline" className="w-full sm:w-auto">
                    {!isApiReady ? (<><Loader2 className="mr-2 animate-spin" />Loading Auth</>) : (isLoggedIn ? <><LogOut className="mr-2" /> Sign Out</> : <><LogIn className="mr-2" /> Sign In with Google</>)}
                </Button>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Market Hits Record High" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Start writing your news article here..." rows={8} {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField control={form.control} name="layout" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Layout on Homepage</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a layout" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="1-block">1-Block (Standard)</SelectItem>
                                            <SelectItem value="2-block">2-Block (Wide)</SelectItem>
                                            <SelectItem value="3-block">3-Block (Full-width Banner)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notify by SMS</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a recipient" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {phoneNumbers.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <Button type="submit" disabled={isPublishing || !isLoggedIn} className="w-full bg-primary hover:bg-primary/90" size="lg">
                            {isPublishing ? <Loader2 className="mr-2 animate-spin" /> : <FileUp className="mr-2" />}
                            {isPublishing ? 'Publishing...' : 'Publish Article'}
                        </Button>
                        {!isLoggedIn && <p className="text-sm text-destructive text-center">You must be signed in with Google to publish.</p>}
                    </form>
                </Form>
            </CardContent>
        </Card>

        <div className="absolute -left-[9999px] top-auto w-[800px] p-8 bg-white text-black font-['Alegreya']" ref={articleRef} style={{left: "-9999px", position: "absolute"}}>
            <h1 style={{ fontFamily: 'Belleza, sans-serif', fontSize: '2.5rem', marginBottom: '1rem', color: '#2E3192' }}>{watchedValues.title}</h1>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#333' }}>{watchedValues.description}</p>
            <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#555', borderTop: '1px solid #ddd', paddingTop: '0.5rem' }}>
              Published on {currentDate} by NewsFlash
            </p>
        </div>
    </div>
  );
}
