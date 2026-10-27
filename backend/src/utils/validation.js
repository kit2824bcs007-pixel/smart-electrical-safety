export function validateSensor(payload = {}, { partial = false } = {}) {
  const errors = [];
  const required = ['id','location','area','latitude','longitude'];
  for (const field of required) {
    if (!partial && (payload[field] === undefined || payload[field] === null || String(payload[field]).trim() === '')) {
      errors.push(`${field} is required.`);
    }
  }
  if (payload.id !== undefined && !/^[A-Za-z0-9-]{2,24}$/.test(String(payload.id))) errors.push('id must be 2–24 letters, numbers, or hyphens.');
  if (payload.location !== undefined && !String(payload.location).trim()) errors.push('location cannot be empty.');
  if (payload.area !== undefined && !String(payload.area).trim()) errors.push('area cannot be empty.');
  if (payload.latitude !== undefined && (!Number.isFinite(Number(payload.latitude)) || Number(payload.latitude) < -90 || Number(payload.latitude) > 90)) errors.push('latitude must be between -90 and 90.');
  if (payload.longitude !== undefined && (!Number.isFinite(Number(payload.longitude)) || Number(payload.longitude) < -180 || Number(payload.longitude) > 180)) errors.push('longitude must be between -180 and 180.');
  return errors;
}

export function parseDateRange(query) {
  const errors = [];
  let from;
  let to;
  if (query.from) {
    from = new Date(query.from);
    if (Number.isNaN(from.getTime())) errors.push('from must be a valid date.');
  }
  if (query.to) {
    to = new Date(query.to);
    if (Number.isNaN(to.getTime())) errors.push('to must be a valid date.');
  }
  if (from && to && from > to) errors.push('from must not be later than to.');
  return { errors, from: from?.toISOString(), to: to?.toISOString() };
}
