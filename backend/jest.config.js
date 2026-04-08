module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  setupFilesAfterEnv: ["<rootDir>/tests/helpers/setup.ts"],
  coverageDirectory: "./coverage",
  collectCoverageFrom: ["src/**/*.{ts,tsx}", "!src/index.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
};
