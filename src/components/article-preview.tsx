/**
 * Article preview component for PDF generation
 */

import React from 'react';
import { ArticleFormData } from '@/hooks/use-article-form';

interface ArticlePreviewProps {
  data: ArticleFormData;
  currentDate: string;
}

export const ArticlePreview = React.forwardRef<HTMLDivElement, ArticlePreviewProps>(
  ({ data, currentDate }, ref) => {
    return (
      <div
        ref={ref}
        className="absolute -left-[9999px] top-auto w-[800px] p-8 bg-white text-black font-body"
        style={{ 
          left: "-9999px", 
          position: "absolute",
          fontFamily: 'Alegreya, serif'
        }}
      >
        <h1 
          style={{ 
            fontFamily: 'Belleza, sans-serif', 
            fontSize: '2.5rem', 
            marginBottom: '1rem', 
            color: '#2E3192',
            lineHeight: '1.2'
          }}
        >
          {data.title || 'Article Title'}
        </h1>
        
        <div 
          style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.6', 
            color: '#333',
            marginBottom: '2rem',
            whiteSpace: 'pre-wrap'
          }}
        >
          {data.description || 'Article description will appear here...'}
        </div>
        
        <div 
          style={{ 
            fontSize: '0.9rem', 
            color: '#666',
            borderTop: '2px solid #2E3192',
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>Published by NewsFlash</span>
          <span>{currentDate}</span>
        </div>
      </div>
    );
  }
);

ArticlePreview.displayName = 'ArticlePreview';