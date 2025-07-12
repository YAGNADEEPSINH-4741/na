"use client";

import { useNews } from '@/hooks/use-news';
import { NewsCard } from '@/components/news-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Newspaper } from 'lucide-react';

export default function NewsFeed() {
  const { articles, loading } = useNews();

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3 p-4 border rounded-lg bg-card">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-20 bg-card/50 rounded-lg border border-dashed">
        <Newspaper className="mx-auto h-12 w-12 text-muted-foreground" />
        <h2 className="mt-6 text-2xl font-headline font-semibold">No News Published Yet</h2>
        <p className="text-muted-foreground mt-2">Go to the admin panel to publish the first article!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in-0 duration-500">
      {articles.map((article) => (
        <NewsCard key={article.id} article={article} />
      ))}
    </div>
  );
}
