"use client";

interface LoadingResultsProps {
  message?: string;
}

export default function LoadingResults({
  message = "Preparing your results…",
}: LoadingResultsProps) {
  return (
    <div className="page-shell justify-center">
      <div className="animate-fade-in text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
        <p className="text-[14px] text-muted">{message}</p>
      </div>
    </div>
  );
}
