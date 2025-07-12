"use client";

import { useState, useEffect, useCallback } from 'react';
import { type NewsArticle } from '@/types';

const STORAGE_KEY = 'newsflash-articles';

export function useNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const items = window.localStorage.getItem(STORAGE_KEY);
      if (items) {
        const parsedArticles = JSON.parse(items);
        // Sort articles by creation date (newest first)
        const sortedArticles = parsedArticles.sort((a: NewsArticle, b: NewsArticle) => b.createdAt - a.createdAt);
        setArticles(sortedArticles);
      }
    } catch (error) {
      console.error("Failed to load news articles from localStorage", error);
      // Clear corrupted data
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const addArticle = useCallback((newArticle: NewsArticle) => {
    setArticles(prevArticles => {
      // Ensure articles are sorted by creation date
      const updatedArticles = [newArticle, ...prevArticles].sort((a, b) => b.createdAt - a.createdAt);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));
      } catch (error) {
        console.error("Failed to save news article to localStorage", error);
        return prevArticles;
      }
      return updatedArticles;
    });
  }, []);

  return { articles, loading, addArticle };
}
