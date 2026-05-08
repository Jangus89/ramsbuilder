import { buildCompliancePrompt, buildFixPrompt } from '../../components/CompliancePanel';

describe('compliance prompt helpers', () => {
  it('includes mandatory controls', () => {
    const prompt = buildCompliancePrompt({ taskType: 'Road Works' }, { mandatoryControls: 'Wear hi-vis' }, []);
    expect(prompt).toContain('Wear hi-vis');
  });

  it('includes procedure text', () => {
    const prompt = buildCompliancePrompt({ taskType: 'Road Works' }, {}, [{ title: 'Traffic', text: 'Chapter 8 controls' }]);
    expect(prompt).toContain('Chapter 8 controls');
  });

  it('buildFixPrompt includes selected issues', () => {
    const prompt = buildFixPrompt({}, [
      { severity: 'Critical', section: 'Hazards', issue: 'Missing control', recommendation: 'Add control' },
      { severity: 'Warning', section: 'PPE', issue: 'Missing PPE', recommendation: 'Add PPE' },
    ]);
    expect(prompt).toContain('Missing control');
    expect(prompt).toContain('Missing PPE');
  });
});
