export class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return cached.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}
