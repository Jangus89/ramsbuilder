import { filterGuidanceForTask } from '../hseGuidance';

describe('filterGuidanceForTask', () => {
  it('returns array of length <= limit', () => {
    const result = filterGuidanceForTask('Excavation / Groundworks', 5);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('returns results relevant to the task type', () => {
    const result = filterGuidanceForTask('Excavation / Groundworks', 5);
    expect(result.length).toBeGreaterThan(0);
    const titles = result.map(r => r.title.toLowerCase()).join(' ');
    expect(titles).toMatch(/underground|excavat|construction|hsg47/i);
  });

  it('returns general guidance for unknown task types', () => {
    const result = filterGuidanceForTask('Something Completely Unknown', 5);
    expect(Array.isArray(result)).toBe(true);
    // Universal keywords should still match some entries
  });

  it('each result has title and url', () => {
    const result = filterGuidanceForTask('Working at Height', 3);
    result.forEach(entry => {
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('url');
      expect(typeof entry.title).toBe('string');
      expect(typeof entry.url).toBe('string');
    });
  });
});
