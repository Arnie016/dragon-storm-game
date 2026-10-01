// Continuous projectile intersections. Return the earliest fraction on [0, 1],
// or Infinity for a miss. Accept Vector3 instances or plain {x, y, z} values.
const EPS = 1e-12;
const finitePoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
const inSegment = t => t >= -EPS && t <= 1 + EPS ? Math.max(0, Math.min(1, t)) : Infinity;

export function segmentSphereT(from, to, center, radius) {
  if (!finitePoint(from) || !finitePoint(to) || !finitePoint(center) || !Number.isFinite(radius) || radius < 0) return Infinity;
  const x = from.x - center.x, y = from.y - center.y, z = from.z - center.z;
  const dx = to.x - from.x, dy = to.y - from.y, dz = to.z - from.z;
  const c = x*x + y*y + z*z - radius*radius;
  if (c <= 0) return 0;
  const a = dx*dx + dy*dy + dz*dz;
  if (a === 0) return Infinity;
  const b = x*dx + y*dy + z*dz;
  if (b >= 0) return Infinity;
  const discriminant = b*b - a*c;
  const tolerance = EPS * Math.max(1, b*b, Math.abs(a*c));
  if (discriminant < -tolerance) return Infinity;
  const root = Math.sqrt(Math.max(0, discriminant));
  // This equivalent form avoids cancellation for a near-surface entry.
  return inSegment(c / (-b + root));
}

export function segmentColumnT(from, to, column, padding = 0) {
  if (!finitePoint(from) || !finitePoint(to) || !column ||
      !Number.isFinite(column.x) || !Number.isFinite(column.z) ||
      !Number.isFinite(column.r) || !Number.isFinite(column.top) ||
      !Number.isFinite(padding) || column.r + padding < 0) return Infinity;
  const radius = column.r + padding;
  const bottom = column.bottom == null ? -Infinity : column.bottom - padding;
  const top = column.top + padding;
  if (Number.isNaN(bottom) || bottom > top) return Infinity;
  let enter = 0, leave = 1;
  const x = from.x - column.x, z = from.z - column.z;
  const dx = to.x - from.x, dz = to.z - from.z;
  const a = dx*dx + dz*dz, b = x*dx + z*dz;
  const c = x*x + z*z - radius*radius;
  if (a === 0) {
    if (c > 0) return Infinity;
  } else {
    const discriminant = b*b - a*c;
    const tolerance = EPS * Math.max(1, b*b, Math.abs(a*c));
    if (discriminant < -tolerance) return Infinity;
    const root = Math.sqrt(Math.max(0, discriminant));
    const q = -b - (b < 0 ? -root : root);
    let first, last;
    if (q === 0) first = last = -b/a;
    else { first = q/a; last = c/q; if (first > last) [first, last] = [last, first]; }
    enter = Math.max(enter, first);
    leave = Math.min(leave, last);
  }
  const dy = to.y - from.y;
  if (dy === 0) {
    if (from.y < bottom || from.y > top) return Infinity;
  } else {
    let first = (bottom - from.y)/dy, last = (top - from.y)/dy;
    if (first > last) [first, last] = [last, first];
    enter = Math.max(enter, first);
    leave = Math.min(leave, last);
  }
  return enter <= leave + EPS ? inSegment(enter) : Infinity;
}
