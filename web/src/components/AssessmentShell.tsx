import type { ReactNode } from "react";

interface AssessmentShellProps {
  children: ReactNode;
  footer?: ReactNode;
}

export default function AssessmentShell({ children, footer }: AssessmentShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col bg-background">
      <div className="mx-auto w-full max-w-xl flex-1 px-5 pb-36 pt-6 sm:px-8 sm:pt-8">
        {children}
      </div>
      {footer && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card">
          <div className="mx-auto max-w-xl px-5 py-4 sm:px-8">{footer}</div>
        </div>
      )}
    </div>
  );
}
