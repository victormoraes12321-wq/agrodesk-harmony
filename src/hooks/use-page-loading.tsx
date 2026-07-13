import { useEffect, useState } from "react";

export function usePageLoading(delayMs = 240) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), delayMs);
    return () => clearTimeout(timeout);
  }, [delayMs]);

  return loading;
}
