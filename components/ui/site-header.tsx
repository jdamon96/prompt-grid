"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Github, Info, MessageSquare } from "lucide-react";
import Link from "next/link";

const GITHUB_REPO_URL = "https://github.com/jdamon96/prompt-grid";

export function SiteHeader() {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2 justify-between w-full">
          <h1 className="text-base font-medium">Prompt Grid</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/info/apikeys"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:hover:bg-yellow-800/50 transition-colors"
              title="Learn more about API key security"
            >
              <Info size={16} />
              <span className="text-sm font-medium">API Key Info</span>
            </Link>
            <button
              onClick={() => window.openFeedbackModal && window.openFeedbackModal()}
              className="hover:cursor-pointer inline-flex items-center gap-1 px-3 py-2 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-800/50 transition-colors"
            >
              <MessageSquare size={16} />
              <span className="text-sm font-medium">Feedback</span>
            </button>
            <a 
              href={GITHUB_REPO_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-black/10 dark:bg-white/10 text-xs font-medium text-black dark:text-white hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-sm"
            >
              <Github size={16} />
              <span className="text-sm font-medium">Open Source</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
} 