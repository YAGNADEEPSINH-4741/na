"use client";

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNews } from '@/hooks/use-news';
import { useGoogleApi } from '@/hooks/use-google-api';
import { useArticleForm, type ArticleFormData } from '@/hooks/use-article-form';
import { PdfGenerator } from '@/lib/pdf-generator';
import { SmsSimulator } from '@/lib/sms-simulator';
import { type NewsArticle } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { ArticlePreview } from '@/components/article-preview';
import { LogIn, LogOut, FileUp, Loader2 } from 'lucide-react';

export default function AdminPanel() {
  const { toast } = useToast();
  const { addArticle } = useNews();
  const { form, phoneNumbers } = useArticleForm();
  const { isApiReady, isLoggedIn, isLoading: apiLoading, signIn, signOut, uploadFile } = useGoogleApi();
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [currentDate] = useState(() => 
    new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  );
  
  const articleRef = useRef<HTMLDivElement>(null);
  const watchedValues = form.watch();

  const handleAuthClick = useCallback(async () => {
    if (isLoggedIn) {
      signOut();
    } else {
      await signIn();
    }
  }, [isLoggedIn, signIn, signOut]);

  const onSubmit = useCallback(async (values: ArticleFormData) => {
    if (!isLoggedIn) {
      toast({ 
        variant: 'destructive', 
        title: 'Authentication Required', 
        description: 'Please sign in with Google to publish articles.' 
      });
      return;
    }

    if (!articleRef.current) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Article preview not available for PDF generation.' 
      });
      return;
    }

    setIsPublishing(true);
    
    try {
      // Generate PDF
      const filename = PdfGenerator.createFilename(values.title);
      const pdfBlob = await PdfGenerator.generateFromElement(articleRef.current, {
        filename,
        margin: 0.5,
      });

      // Upload to Google Drive
      const publicLink = await uploadFile(pdfBlob, filename);

      // Create article
      const newArticle: NewsArticle = {
        id: new Date().toISOString(),
        title: values.title,
        description: values.description,
        layout: values.layout,
        createdAt: Date.now(),
        pdfLink: publicLink,
      };

      addArticle(newArticle);

      // Send SMS notification
      const smsMessage = SmsSimulator.formatNotificationMessage(values.title, publicLink);
      await SmsSimulator.sendMessage(values.phone, smsMessage);

      // Success feedback
      toast({ 
        title: 'Article Published!', 
        description: 'Your article has been published and notifications sent.' 
      });

      // Reset form
      form.reset();

    } catch (error: any) {
      console.error("Publishing error:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Publishing Failed', 
        description: error.message || 'An unexpected error occurred while publishing.' 
      });
    } finally {
      setIsPublishing(false);
    }
  }, [isLoggedIn, uploadFile, addArticle, form, toast]);

  const getAuthButtonContent = () => {
    if (apiLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      );
    }
    
    if (isLoggedIn) {
      return (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </>
      );
    }
    
    return (
      <>
        <LogIn className="mr-2 h-4 w-4" />
        Sign In with Google
      </>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6">
          <div className="space-y-2">
            <CardTitle className="font-headline text-3xl text-primary">
              News Editor
            </CardTitle>
            <CardDescription className="text-base">
              Create, generate a PDF, and publish a new article with automatic notifications.
            </CardDescription>
          </div>
          
          <LoadingButton
            onClick={handleAuthClick}
            disabled={!isApiReady}
            loading={apiLoading}
            variant="outline"
            className="w-full sm:w-auto min-w-[160px]"
          >
            {getAuthButtonContent()}
          </LoadingButton>
        </CardHeader>

        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Article Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Market Hits Record High Amid Economic Recovery"
                        className="text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">Article Content</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Write your news article here. Include all the important details, quotes, and context that readers need to understand the story..."
                        rows={10}
                        className="text-base resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="layout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Homepage Layout</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select layout size" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-block">1-Block (Standard Card)</SelectItem>
                          <SelectItem value="2-block">2-Block (Wide Card)</SelectItem>
                          <SelectItem value="3-block">3-Block (Full-width Banner)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">SMS Notification</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select notification recipient" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {phoneNumbers.map((phone) => (
                            <SelectItem key={phone.value} value={phone.value}>
                              {phone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <LoadingButton
                  type="submit"
                  disabled={!isLoggedIn}
                  loading={isPublishing}
                  loadingText="Publishing Article..."
                  icon={<FileUp className="h-4 w-4" />}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  size="lg"
                >
                  Publish Article
                </LoadingButton>
                
                {!isLoggedIn && (
                  <p className="text-sm text-muted-foreground text-center mt-3">
                    Sign in with Google to publish articles and upload PDFs to Drive
                  </p>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Hidden article preview for PDF generation */}
      <ArticlePreview
        ref={articleRef}
        data={watchedValues}
        currentDate={currentDate}
      />
    </div>
  );
}