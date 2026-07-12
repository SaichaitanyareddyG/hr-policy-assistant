/**
 * Example Prompts Component
 * 
 * Shows pre-written example questions to help employees get started
 */

'use client';

import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface ExamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

const EXAMPLE_PROMPTS = [
  'How many paid leaves do I get?',
  'Is gym reimbursement available?',
  'Can I claim internet reimbursement?',
  'What is the notice period?',
  'What documents are needed for travel reimbursement?',
  'What is the work from home policy?',
];

export function ExamplePrompts({ onSelectPrompt }: ExamplePromptsProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <MessageSquare className="w-4 h-4" />
        <span>Try asking:</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {EXAMPLE_PROMPTS.map((prompt, index) => (
          <Card
            key={index}
            className="p-3 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
            onClick={() => onSelectPrompt(prompt)}
          >
            <p className="text-sm text-gray-700">{prompt}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
