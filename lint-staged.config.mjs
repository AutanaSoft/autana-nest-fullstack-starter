// Oxlint resolves the nearest .oxlintrc.json for each file, so it can run once from the repo root.
export default {
  "*.{ts,tsx}": ["prettier --write", "oxlint"],
  "*.{json,jsonc,css,yml,yaml}": "prettier --write",
  "*.{md,mdx}": ["prettier --write", "markdownlint-cli2"],
}
