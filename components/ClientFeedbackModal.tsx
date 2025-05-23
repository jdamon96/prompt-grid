"use client";
declare global {
  interface Window {
    openFeedbackModal?: () => void;
  }
}
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClientFeedbackModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  // Expose open function globally for header button
  useEffect(() => {
    window.openFeedbackModal = () => setIsOpen(true);
    return () => { delete window.openFeedbackModal; };
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const updateMessage = (value: string) => setMessage(value);
  const submit = () => {
    const firstSentence = message.split(/[.!?]/)[0].trim();
    const truncatedSentence = firstSentence.length > 50 
      ? `${firstSentence.substring(0, 50)}...` 
      : firstSentence;
    const subject = `[Prompt Grid Feature Request] ${truncatedSentence}`;
    const mailtoLink = `mailto:jdamon96@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    window.open(mailtoLink, '_blank');
    close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={close}>
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md mx-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 p-4">
          <h3 className="font-semibold text-lg">Feedback & Feature Requests</h3>
          <button
            onClick={close}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We&apos;d love to hear your feedback or feature requests for Prompt Grid. Your input helps us improve!
          </p>
          <div>
            <label htmlFor="feedback-message" className="block text-sm font-medium mb-1">
              Your Feedback or Feature Request
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={e => updateMessage(e.target.value)}
              placeholder="I&apos;d like to suggest a new feature for Prompt Grid..."
              rows={6}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-transparent focus:outline-none focus:border-black dark:focus:border-white"
            />
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-800 p-4 flex justify-end gap-2">
          <button
            onClick={close}
            className="px-4 py-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!message.trim()}
            className={cn(
              "px-4 py-2 rounded-md font-medium",
              "bg-blue-600 text-white hover:bg-blue-700",
              "dark:bg-blue-700 dark:hover:bg-blue-800",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
} 