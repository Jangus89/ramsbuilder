import { injectProfileIntoPrompt } from '../companyProfile';

describe('injectProfileIntoPrompt', () => {
  it('returns empty string for empty profile', () => {
    expect(injectProfileIntoPrompt({})).toBe('');
  });

  it('returns all fields formatted for a full profile', () => {
    const profile = {
      companyName: 'Acme Ltd',
      companyAddress: '123 Main St',
      siteManagerName: 'John',
      siteManagerPhone: '07123456789',
      supervisorName: 'Jane',
      supervisorPhone: '07987654321',
      firstAiderName: 'Bob',
      firstAiderPhone: '07111222333',
      emergencyAssemblyPoint: 'Car park',
      nearestHospital: 'City Hospital',
      riskMatrixDefinition: '3x3 matrix',
      mandatoryControls: 'Induction required',
      ptwTriggers: 'Hot works → PTW',
      docRefFormat: 'RA-{SITE}-{YYYY}',
      additionalGuidance: 'Use Method X',
    };
    const result = injectProfileIntoPrompt(profile);
    expect(result).toContain('COMPANY MANAGEMENT SYSTEM');
    expect(result).toContain('Acme Ltd');
    expect(result).toContain('123 Main St');
    expect(result).toContain('John');
    expect(result).toContain('07123456789');
    expect(result).toContain('Jane');
    expect(result).toContain('Bob');
    expect(result).toContain('Car park');
    expect(result).toContain('City Hospital');
    expect(result).toContain('3x3 matrix');
    expect(result).toContain('Induction required');
    expect(result).toContain('Hot works');
    expect(result).toContain('RA-{SITE}-{YYYY}');
    expect(result).toContain('Method X');
  });

  it('only includes non-empty fields', () => {
    const profile = { companyName: 'TestCo', siteManagerName: '' };
    const result = injectProfileIntoPrompt(profile);
    expect(result).toContain('TestCo');
    expect(result).not.toContain('SITE MANAGER');
  });
});
