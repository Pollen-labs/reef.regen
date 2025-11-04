// Minimal no-op stub for web builds that encounter RN async-storage imports
const AsyncStorage = {
  getItem: async (_key: string) => null as any,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
};

export default AsyncStorage;

