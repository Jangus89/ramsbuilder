export function riskScore(likelihood, severity) {
  return Number(likelihood || 0) * Number(severity || 0);
}

export function riskLabel(score) {
  if (score >= 15) return 'High';
  if (score >= 7) return 'Medium';
  return 'Low';
}

export function validateRiskMatrix(ramsData) {
  const issues = [];
  (ramsData?.hazards || []).forEach((hazard, index) => {
    const name = hazard.hazard || `Hazard ${index + 1}`;
    const initialScore = riskScore(hazard.initialLikelihood, hazard.initialSeverity);
    const residualScore = riskScore(hazard.residualLikelihood, hazard.residualSeverity);
    const initialLabel = riskLabel(initialScore);
    const residualLabel = riskLabel(residualScore);

    if (hazard.initialRisk && hazard.initialRisk !== initialLabel) {
      issues.push(`${name}: initialRisk "${hazard.initialRisk}" should be "${initialLabel}" for score ${initialScore}.`);
    }
    if (hazard.residualRisk && hazard.residualRisk !== residualLabel) {
      issues.push(`${name}: residualRisk "${hazard.residualRisk}" should be "${residualLabel}" for score ${residualScore}.`);
    }
    if (residualScore >= initialScore) {
      issues.push(`${name}: residual score ${residualScore} must be lower than initial score ${initialScore}.`);
    }
  });
  return issues;
}
