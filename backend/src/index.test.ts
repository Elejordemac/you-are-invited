import { describe, it, expect } from 'vitest';

describe('Backend Setup', () => {
  it('should have a working test environment', () => {
    expect(true).toBe(true);
  });

  it('should support TypeScript features', () => {
    interface TestType {
      name: string;
      value: number;
    }

    const testObj: TestType = { name: 'test', value: 42 };
    expect(testObj.name).toBe('test');
    expect(testObj.value).toBe(42);
  });
});
