module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/setup.ts"],
  coverageDirectory: "./coverage",
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/index.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 50,
      statements: 50,
    },
  },
};
