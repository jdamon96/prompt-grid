import PromptGrid from "@/components/PromptGrid";
import { Suspense } from "react";

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen px-8 sm:px-12 py-4">
      <Suspense>
        <PromptGrid />
      </Suspense>
    </div>
  );
} 