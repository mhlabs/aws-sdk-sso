/** @typedef {import('ts-jest')} */
/** @type {import('@jest/types').Config.InitialOptions} */

const config = {
  maxConcurrency: 1,
  maxWorkers: 4,
  notify: true,
  testEnvironment: "node",
  testTimeout: 30000,
  preset: "ts-jest/presets/js-with-ts",
  forceExit: true,
  errorOnDeprecated: true,
  rootDir: "./",
  testPathIgnorePatterns: ["/node_modules/", "/dist"],
  // setupFilesAfterEnv: ["jest-extended"],
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
    "src/**/*.(spec|test).[jt]s",
  ],
};

module.exports = config;
