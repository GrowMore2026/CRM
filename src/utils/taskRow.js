const TASK_ASSIGN_PREFIX = /^\[TaskAssign\] to=([^;]*); from=([^\n]*)\n([\s\S]*)$/;

/** Map API row (camelCase, snake_case, or embedded `[TaskAssign]` in description). */
export function normalizeTask(row) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };

  if (out.assignedTo == null && out.assigned_to != null) out.assignedTo = out.assigned_to;
  if (out.createdBy == null && out.created_by != null) out.createdBy = out.created_by;

  const rawDesc = String(out.description ?? '');
  const meta = TASK_ASSIGN_PREFIX.exec(rawDesc);
  if (meta) {
    try {
      if (!out.assignedTo) out.assignedTo = decodeURIComponent(meta[1]);
      if (!out.createdBy) out.createdBy = decodeURIComponent(meta[2]);
      out.description = meta[3];
    } catch {
      /* keep raw */
    }
  }

  if (out.id != null) out.id = String(out.id);
  return out;
}

/**
 * Insert task: camelCase cols → snake_case cols → minimal row with assignees embedded in description.
 */
export async function insertTaskWithSchemaFallback(db, taskData) {
  const title = taskData.title ?? '';
  const description = taskData.description ?? '';
  const assignee = taskData.assignedTo ?? '';
  const creator = taskData.createdBy ?? '';
  const status = 'Pending';

  const camel = {
    title,
    description,
    assignedTo: assignee,
    createdBy: creator,
    status,
  };

  const snake = {
    title,
    description,
    assigned_to: assignee,
    created_by: creator,
    status,
  };

  let res = await db.from('tasks').insert([camel]).select();
  if (!res.error) return res;

  if (res.error.code !== 'PGRST204') return res;

  res = await db.from('tasks').insert([snake]).select();
  if (!res.error) return res;

  if (res.error.code !== 'PGRST204') return res;

  const encoded =
    `[TaskAssign] to=${encodeURIComponent(assignee)}; from=${encodeURIComponent(creator)}\n${description}`;
  res = await db.from('tasks').insert([{ title, description: encoded, status }]).select();
  return res;
}
