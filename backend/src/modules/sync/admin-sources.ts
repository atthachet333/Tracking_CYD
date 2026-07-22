export const ADMIN_SYNC_SOURCES = [
  { slug: "p-kim", sheet: "พี่คิม", assignee: "พี่คิม", tabs: ["พี่คิม"] },
  { slug: "am", sheet: "แอม", assignee: "แอม", tabs: ["แอม"] },
  { slug: "p-vee", sheet: "พี่วี", assignee: "พี่วี", tabs: ["พี่วี", "พี่วิ"] },
  { slug: "p-ann", sheet: "พี่แอน", assignee: "พี่แอน", tabs: ["พี่แอน"] },
] as const;

export type AdminSyncSource = (typeof ADMIN_SYNC_SOURCES)[number];
export type AdminSyncSlug = AdminSyncSource["slug"];

export function findAdminSyncSource(slug: string): AdminSyncSource | undefined {
  return ADMIN_SYNC_SOURCES.find((source) => source.slug === slug);
}
