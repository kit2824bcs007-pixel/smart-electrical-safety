export default function errorHandler(error, _req, res, _next) {
  if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ error: 'A sensor with that ID already exists.' });
  }
  if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  console.error(error);
  return res.status(error.status || 500).json({ error: error.status ? error.message : 'An unexpected server error occurred.' });
}
