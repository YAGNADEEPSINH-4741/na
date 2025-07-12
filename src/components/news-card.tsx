import { type NewsArticle } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function NewsCard({ article }: { article: NewsArticle }) {
  const layoutClasses = {
    '1-block': 'md:col-span-1',
    '2-block': 'md:col-span-2',
    '3-block': 'lg:col-span-3 md:col-span-2',
  };

  return (
    <Card className={cn(
        "flex flex-col h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 bg-card",
        layoutClasses[article.layout]
      )}
    >
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">{article.title}</CardTitle>
        <CardDescription className="flex items-center gap-2 pt-2 text-sm">
          <Calendar className="h-4 w-4" />
          <span>{new Date(article.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-4 font-body leading-relaxed">{article.description}</p>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
          <Link href={article.pdfLink} target="_blank" rel="noopener noreferrer">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
