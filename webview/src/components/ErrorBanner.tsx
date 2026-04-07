import type { ParseError } from "../types/schema";

interface ErrorBannerProps {
  errors: ParseError[];
}

export function ErrorBanner({ errors }: ErrorBannerProps): JSX.Element | null {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border border-red-500/60 bg-red-600/10 px-3 py-2 text-xs text-red-200">
      <p className="font-semibold">SQL Parse Error</p>
      <p>{errors[0].message}</p>
    </div>
  );
}
