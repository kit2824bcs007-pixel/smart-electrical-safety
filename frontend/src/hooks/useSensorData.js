import { useCallback, useEffect, useState } from 'react';
import { getSensors } from '../api/api.js';

export default function useSensorData(refreshMs = 12000) {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    try {
      const data = await getSensors();
      setSensors(data.sensors);
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to load sensors.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, refreshMs);
    return () => window.clearInterval(timer);
  }, [refresh, refreshMs]);
  return { sensors, loading, error, refresh };
}
