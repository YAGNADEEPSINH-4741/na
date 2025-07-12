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
        setArticles(JSON.parse(items));
      }
    } catch (error) {
      console.error("Failed to load news articles from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addArticle = useCallback((newArticle: NewsArticle) => {
    setArticles(prevArticles => {
      const updatedArticles = [newArticle, ...prevArticles];
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedArticles));
      } catch (error) {
        console.error("Failed to save news article to localStorage", error);
        // Revert state if save fails by returning previous articles
        return prevArticles;
      }
      return updatedArticles;
    });
  }, []);

  return { articles, loading, addArticle };
}
