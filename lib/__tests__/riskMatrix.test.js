import { riskLabel, riskScore, validateRiskMatrix } from '../riskMatrix';

describe('risk matrix', () => {
  it('calculates all 25 scores', () => {
    for (let l = 1; l <= 5; l++) {
      for (let s = 1; s <= 5; s++) {
        expect(riskScore(l, s)).toBe(l * s);
      }
    }
  });

  it('maps labels correctly', () => {
    [1, 2, 3, 4, 5, 6].forEach(score => expect(riskLabel(score)).toBe('Low'));
    [7, 8, 9, 10, 11, 12, 13, 14].forEach(score => expect(riskLabel(score)).toBe('Medium'));
    [15, 16, 20, 25].forEach(score => expect(riskLabel(score)).toBe('High'));
  });

  it('catches residualRisk label mismatch', () => {
    const issues = validateRiskMatrix({ hazards: [{ hazard: 'A', initialLikelihood: 4, initialSeverity: 4, initialRisk: 'High', residualLikelihood: 1, residualSeverity: 1, residualRisk: 'High' }] });
    expect(issues.join(' ')).toContain('residualRisk');
  });

  it('catches residual score not reduced', () => {
    const issues = validateRiskMatrix({ hazards: [{ hazard: 'A', initialLikelihood: 2, initialSeverity: 2, initialRisk: 'Low', residualLikelihood: 2, residualSeverity: 2, residualRisk: 'Low' }] });
    expect(issues.join(' ')).toContain('must be lower');
  });
});
