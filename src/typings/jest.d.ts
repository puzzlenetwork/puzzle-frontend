// Jest type declarations to resolve TypeScript errors in test files
declare namespace jest {
  function fn<T>(implementation?: (...args: any[]) => T): Mock<T>;
  interface Mock<T> {
     (...args: any[]): any;
     mock: {
       calls: any[][];
       instances: any[];
       invocationCallOrder: number[];
       results: Array<{ type: 'return' | 'throw'; value: any }>;
     };
     mockClear(): Mock<T>;
     mockReset(): Mock<T>;
     mockRestore(): void;
     mockImplementation(fn: (...args: any[]) => any): Mock<T>;
     mockImplementationOnce(fn: (...args: any[]) => any): Mock<T>;
     mockReturnThis(): Mock<T>;
     mockReturnValue(value: any): Mock<T>;
     mockReturnValueOnce(value: any): Mock<T>;
     mockResolvedValue(value: any): Mock<T>;
     mockResolvedValueOnce(value: any): Mock<T>;
     mockRejectedValue(value: any): Mock<T>;
     mockRejectedValueOnce(value: any): Mock<T>;
   }
}

declare const jest: {
  fn: typeof jest.fn;
  spyOn: (obj: any, methodName: string) => jest.Mock<any>;
  clearAllMocks: () => void;
  resetAllMocks: () => void;
  restoreAllMocks: () => void;
};
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const test: (name: string, fn: () => void) => void;
declare const expect: (value: any) => {
  toBe: (expected: any) => void;
  toEqual: (expected: any) => void;
  toThrow: (expected?: string | Error | RegExp) => void;
  toThrowError: (expected?: string | Error | RegExp) => void;
  toHaveBeenCalled: () => void;
  toHaveBeenCalledTimes: (times: number) => void;
  toHaveBeenCalledWith: (...args: any[]) => void;
  toHaveBeenLastCalledWith: (...args: any[]) => void;
  toBeTruthy: () => void;
  toBeFalsy: () => void;
  toBeNull: () => void;
  toBeUndefined: () => void;
  toBeDefined: () => void;
  toBeGreaterThan: (expected: number) => void;
  toBeGreaterThanOrEqual: (expected: number) => void;
  toBeLessThan: (expected: number) => void;
  toBeLessThanOrEqual: (expected: number) => void;
  toMatch: (expected: string | RegExp) => void;
  toContain: (expected: any) => void;
  toMatchObject: (expected: any) => void;
  toMatchSnapshot: () => void;
  toHaveLength: (expected: number) => void;
  toHaveProperty: (key: string, value?: any) => void;
  toBeCloseTo: (expected: number, precision?: number) => void;
  toBeInstanceOf: (expected: any) => void;
  toSatisfy: (expected: (value: any) => boolean) => void;
  not: any;
  resolves: any;
  rejects: any;
};
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const beforeAll: (fn: () => void) => void;
declare const afterAll: (fn: () => void) => void;