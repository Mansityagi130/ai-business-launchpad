import React from "react";
import { Button } from "@launchpad/ui";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl md:text-6xl font-bold text-amber-500 mb-4">
        AI Business Launchpad
      </h1>
      <p className="text-lg md:text-xl text-slate-350 max-w-2xl mb-8">
        Create, manage, and grow your online presence using voice and text instructions.
      </p>
      <div className="flex gap-4">
        <Button label="Get Started" variant="primary" />
        <Button label="View Demo" variant="outline" />
      </div>
    </main>
  );
}
