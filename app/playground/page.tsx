import PromptGrid from "@/components/PromptGrid";
import { Suspense } from "react";

export default function PlaygroundPage() {
  return (
    <div className="min-h-screen p-8 sm:p-12">
      <Suspense>
        <PromptGrid />
      </Suspense>
    </div>
  );
} 