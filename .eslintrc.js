module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: [
    "@typescript-eslint"
  ],
  extends: [
    "plugin:@typescript-eslint/recommended"
  ],
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 2019
  },
  rules: {
    "no-use-before-define": "off",
    "no-unused-vars": "off",
    "quotes": [2, "single", { "allowTemplateLiterals": true, "avoidEscape": true }],
		"object-curly-spacing": [2, "always"],
    semi: ["error", "never"],
    "max-len": ["error", 255],
    "@typescript-eslint/indent": ["error", 2],
    "@typescript-eslint/member-delimiter-style": ["error", {
      multiline: {
        delimiter: "none",
        requireLast: false
      },
      singleline: {
        delimiter: "comma",
        requireLast: false
      }
    }],
    "@typescript-eslint/no-unused-vars": ["error", {
      vars: "all",
      args: "after-used",
      varsIgnorePattern: "^_",
      argsIgnorePattern: "^_"
    }],
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/no-use-before-define": ["error", {
      functions: false,
      classes: true,
      variables: true
    }],
    "@typescript-eslint/explicit-function-return-type": ["error", {
      allowExpressions: true 
    }]
  }
}
