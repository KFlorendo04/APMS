// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Existing data hooks intentionally reset local request state when their
      // authenticated query inputs change. The effects also cancel stale writes.
      "react-hooks/set-state-in-effect": "off",
    },
  }
]);
