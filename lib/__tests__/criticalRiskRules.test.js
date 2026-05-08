import { buildCriticalRiskPrompt, buildMandatoryHazardsBlock, filterCriticalRules, validateCriticalRisks } from '../criticalRiskRules';

describe('critical risk rules', () => {
  it('matches excavation', () => {
    expect(filterCriticalRules({ taskType: 'Excavation / Trenching' }).some(rule => rule.id === 'ground-disturbance-services')).toBe(true);
  });

  it('matches highway works', () => {
    expect(filterCriticalRules({ taskType: 'Road / Highway Works' }).some(rule => rule.id === 'live-traffic-highways')).toBe(true);
  });

  it('matches working at height', () => {
    expect(filterCriticalRules({ taskType: 'Working at Height' }).some(rule => rule.id === 'work-at-height')).toBe(true);
  });

  it('returns empty for no match', () => {
    expect(filterCriticalRules({ taskType: 'Office paperwork' })).toEqual([]);
  });

  it('matched rules include hazard and controls', () => {
    const [rule] = filterCriticalRules({ taskType: 'Road / Highway Works' });
    expect(rule.hazard).toBeTruthy();
    expect(rule.controls.length).toBeGreaterThan(0);
  });

  it('builds mandatory hazards prompt block', () => {
    const rules = filterCriticalRules({ taskType: 'Road / Highway Works' });
    expect(buildMandatoryHazardsBlock(rules)).toContain('MANDATORY_HAZARDS');
    expect(buildCriticalRiskPrompt(rules)).toContain('CRITICAL RISK REQUIREMENTS');
  });

  it('validates missing critical controls', () => {
    const rules = filterCriticalRules({ taskType: 'Road / Highway Works' });
    expect(validateCriticalRisks({ hazards: [] }, rules)[0].title).toContain('Live Traffic');
  });

  it('passes when critical keywords are present', () => {
    const rules = filterCriticalRules({ taskType: 'Road / Highway Works' }).filter(rule => rule.id === 'live-traffic-highways');
    const result = validateCriticalRisks({ hazards: [{ hazard: 'Live traffic', controls: 'Use Chapter 8 traffic management cones and barriers.' }] }, rules);
    expect(result).toEqual([]);
  });
});
