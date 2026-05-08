import { filterRelevantProcedures, injectProceduresIntoPrompt } from '../procedureLibrary';

describe('filterRelevantProcedures', () => {
  it('returns empty array for empty input', () => {
    expect(filterRelevantProcedures([], 'Excavation')).toEqual([]);
  });

  it('returns procedures with matching category scored higher', () => {
    const procs = [
      { title: 'Excavation SWP', category: 'Excavation', text: 'Dig safely', code: 'SWP-01' },
      { title: 'Lifting Proc', category: 'Crane', text: 'Lift safely', code: 'SWP-02' },
    ];
    const result = filterRelevantProcedures(procs, 'Excavation / Groundworks');
    expect(result.some(p => p.code === 'SWP-01')).toBe(true);
  });

  it('always includes "all tasks" procedures (empty category)', () => {
    const procs = [
      { title: 'General Safety', category: '', text: 'Always safe', code: 'GEN-01' },
      { title: 'Crane Proc', category: 'Crane', text: 'Crane stuff', code: 'CR-01' },
    ];
    const result = filterRelevantProcedures(procs, 'Excavation');
    expect(result.some(p => p.code === 'GEN-01')).toBe(true);
  });
});

describe('injectProceduresIntoPrompt', () => {
  it('returns empty string for no procedures', () => {
    expect(injectProceduresIntoPrompt([], 'Excavation')).toBe('');
  });

  it('truncates long text to charBudget', () => {
    const longText = 'x'.repeat(20000);
    const procs = [{ title: 'Test', category: '', text: longText, code: 'T-01' }];
    const result = injectProceduresIntoPrompt(procs, 'Excavation', 5000);
    expect(result.length).toBeLessThan(longText.length);
    expect(result).toContain('[truncated');
  });
});
