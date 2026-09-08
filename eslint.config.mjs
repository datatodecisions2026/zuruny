import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/* eslint-config-next 16 ships flat config directly — FlatCompat is no longer
   needed and in fact throws on it. */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  { ignores: [".next/**", "node_modules/**", "zuruny-kit/**"] },
];

export default eslintConfig;
