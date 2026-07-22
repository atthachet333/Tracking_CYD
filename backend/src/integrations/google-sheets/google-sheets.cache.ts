/* ============================================================
   In-Memory Cache (TTL + single-flight)
   - ออกแบบให้เปลี่ยนไปใช้ Redis ได้ในอนาคต (implement interface เดิม)
   - ไม่ cache error ถาวร (เก็บเฉพาะผลสำเร็จ)
   ============================================================ */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  storedAt: number;
}

export class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inflight = new Map<string, Promise<unknown>>();

  constructor(private ttlSeconds: number) {}

  get<T>(key: string): { value: T; hit: true; storedAt: number } | { hit: false } {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (entry && entry.expiresAt > Date.now()) {
      return { value: entry.value, hit: true, storedAt: entry.storedAt };
    }
    if (entry) this.store.delete(key);
    return { hit: false };
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, {
      value,
      storedAt: Date.now(),
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }

  invalidate(key?: string): void {
    if (key) this.store.delete(key);
    else this.store.clear();
  }

  /**
   * single-flight: ถ้ามี request key เดียวกันกำลังทำงานอยู่ ให้รอ promise เดิม
   * ป้องกันการยิง Google API ซ้ำพร้อมกัน (concurrent refresh)
   */
  async dedupe<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const existing = this.inflight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const promise = loader().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }
}
