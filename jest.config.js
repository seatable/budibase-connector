module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "js"],
  testMatch: ["**/test/**/*.spec.ts"],
  testPathIgnorePatterns: ["/node_modules/", "integration\\.spec\\.ts$"],
}
