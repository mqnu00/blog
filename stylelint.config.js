/** @type {import("stylelint").Config} */
export default {
  "extends": ["stylelint-config-recommended", "stylelint-config-recommended-less", "stylelint-config-recommended-vue",],
  overrides: [
    {
      files: ["**/*.vue"],
      customSyntax: "postcss-html"
    },
    {
      files: ["**/*.less"],
      customSyntax: "postcss-less",
    },
  ],
  rules: {
    'declaration-property-value-no-unknown': null,
  }
};
