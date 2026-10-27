export function calculateRisk({ waterLevel, voltage, leakageCurrent, connected = true, change = 0 }) {
  const values = [waterLevel, voltage, leakageCurrent, change].map(Number);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new TypeError('Risk inputs must be finite, non-negative numbers.');
  }
  const [water, volts, leakage, delta] = values;
  const score = Math.max(0, Math.min(100,
    Math.min(35, water * 0.7)
    + Math.min(35, leakage * 1.4)
    + Math.min(20, volts * 0.12)
    + Math.min(10, delta * 0.4)
    + (connected ? 0 : 35)));
  const riskScore = Math.round(score);
  const classification = !connected || leakage >= 25 || riskScore >= 70
    ? 'CRITICAL'
    : riskScore >= 35 || water >= 25
      ? 'WARNING'
      : 'SAFE';
  const explanation = !connected
    ? 'Sensor connection is unavailable; readings may be stale.'
    : leakage >= 25
      ? 'Leakage current exceeds the demonstration critical threshold.'
      : water >= 25
        ? 'Water level is elevated and requires attention.'
        : classification === 'SAFE'
          ? 'Readings are within the configured demonstration range.'
          : 'Combined readings indicate an elevated demonstration risk.';
  const recommendedAction = classification === 'CRITICAL'
    ? 'Treat as a simulated critical event; isolate the area and have qualified personnel inspect it.'
    : classification === 'WARNING'
      ? 'Inspect the location and continue monitoring the simulated readings.'
      : 'Continue routine monitoring.';
  return { riskScore, classification, explanation, recommendedAction };
}
