module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/*.test.ts"],
	collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
	setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
	testTimeout: 100000,
	clearMocks: true,
	restoreMocks: true,
};
