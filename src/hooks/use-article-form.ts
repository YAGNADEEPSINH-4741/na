/**
 * Hook for managing article form state and validation
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

export const articleFormSchema = z.object({
  title: z.string()
    .min(5, { message: "Title must be at least 5 characters long." })
    .max(100, { message: "Title must be less than 100 characters." }),
  description: z.string()
    .min(20, { message: "Description must be at least 20 characters long." })
    .max(2000, { message: "Description must be less than 2000 characters." }),
  layout: z.enum(['1-block', '2-block', '3-block']),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: "Please enter a valid E.164 phone number." }),
});

export type ArticleFormData = z.infer<typeof articleFormSchema>;

export const phoneNumbers = [
  { label: 'Emergency Broadcast', value: '+15550001111' },
  { label: 'Local News Desk', value: '+15552223333' },
  { label: 'Editor-in-Chief', value: '+15554445555' },
];

export function useArticleForm() {
  const form = useForm<ArticleFormData>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: '',
      description: '',
      layout: '1-block',
      phone: phoneNumbers[0].value,
    },
  });

  return {
    form,
    phoneNumbers,
  };
}