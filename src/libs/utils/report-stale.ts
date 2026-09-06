// A completed report job is reusable only if nothing in its scope changed after
// it finished — otherwise stale data would be served. Works with any
// timestamps-enabled mongoose model via updatedAt.
export const isReportStale = async (
  model: { exists: (filter: Record<string, unknown>) => Promise<unknown> },
  scope: Record<string, unknown>,
  completedAt: Date,
): Promise<boolean> =>
  Boolean(await model.exists({ ...scope, updatedAt: { $gt: completedAt } }));