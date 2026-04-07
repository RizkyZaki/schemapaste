import type { ParseError } from "../types/schema";

interface ErrorBannerProps {
  errors: ParseError[];
}

export function ErrorBanner({ errors }: ErrorBannerProps): JSX.Element | null {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-500/50 bg-gradient-to-r from-red-500/15 to-red-900/10 px-3 py-2 text-xs text-red-200">
      <p className="font-semibold tracking-wide">SQL Parse Error</p>
      <p className="mt-1 leading-5">{errors[0].message}</p>
    </div>
  );
}
