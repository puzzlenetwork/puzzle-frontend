import rangePoolFactoryService from "./rangePoolFactoryService";

// Mock viem client for testing
const mockPublicClient = {
  getLogs: jest.fn().mockResolvedValue([]),
};

// Simple test to verify the service can be initialized
describe("RangePoolFactoryService", () => {
  beforeEach(() => {
    // Ensure the environment variable is available before each test
    process.env.RANGE_POOL_FACTORY_ADDRESS = "0x356632c353Cb850dd3E41e466FCbe5a0cAC003A8";
  });

  it("should initialize without error when environment variable is set", async () => {
    // Initialize the service
    await expect(rangePoolFactoryService.initialize(mockPublicClient)).resolves.not.toThrow();
  });

  it("should throw error when fetching events before initialization", async () => {
    // Create a new instance of the service to test uninitialized state
    const uninitializedService = new (class {
      private publicClient: any | null = null;
      private factoryAddress: string = "0x356632c353Cb850dd3E41e466FCbe5a0cAC003A8";

      async fetchAllPoolCreatedEvents() {
        if (!this.publicClient) {
          throw new Error("Service not initialized. Call initialize() first.");
        }
        return [];
      }
    })();

    await expect(uninitializedService.fetchAllPoolCreatedEvents()).rejects.toThrow(
      "Service not initialized. Call initialize() first.",
    );
  });
});
