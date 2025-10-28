export default defineAppConfig({
  // https://ui.nuxt.com/getting-started/theme#design-system
  ui: {
    colors: {
      primary: "rose",
      // info: "--color-info",
      // success: "--color-success",
      // warning: "--color-warning",
      // error: "--color-error",
    },
    formField: {
      slots: {
        error: 'text-xs'
      }  // Apply custom font globally
    }
  },
});
