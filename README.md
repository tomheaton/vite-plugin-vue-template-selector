# vite-plugin-vue-template-selector [![npm](https://img.shields.io/npm/v/vite-plugin-vue-template-selector.svg)](https://npmjs.com/package/vite-plugin-vue-template-selector)

A Vite plugin for Vue.js that allows dynamic template selection at build time.

## Usage

### Install the plugin

```bash
# Using npm
npm install vite-plugin-vue-template-selector --save-dev

# Using yarn
yarn add vite-plugin-vue-template-selector --dev

# Using pnpm
pnpm add vite-plugin-vue-template-selector --save-dev
```

### Select a template by name

```ts
// vite.config.ts
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import vueTemplateSelector from "vite-plugin-vue-template-selector";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // NOTE: The order of plugins matters. Ensure this plugin is before the Vue plugin.
    vueTemplateSelector({
      name: "default",
    }),
    vue(),
  ],
});
```

### Create multiple templates

```vue
<!-- Component.vue -->
<template name="default">
  <div>
    <h1>Default Template</h1>
  </div>
</template>

<template name="alternative">
  <div>
    <h1>Alternative Template</h1>
  </div>
</template>

<script setup lang="ts">
// logic can be shared across templates
</script>
```

## Options

```ts
export type Options = {
  /**
   * The name of the template to select.
   * If not provided, the first template will be used.
   */
  name?: string;
  /**
   * The name of the template to use as a fallback if the primary is not found.
   * If not provided, the first template will be used.
   */
  fallback?: string;
  /**
   * Whether to throw an error if the template is not found.
   * If false, a warning will be logged instead.
   */
  strict?: boolean;
};
```

## License

MIT
