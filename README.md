# vite-plugin-vue-template-selector [![npm](https://img.shields.io/npm/v/vite-plugin-vue-template-selector.svg)](https://npmjs.com/package/vite-plugin-vue-template-selector)

A Vite plugin for Vue.js that allows dynamic template selection at build time.

## Usage

### Select a template by name

```ts
// vite.config.ts
import vueTemplateSelector from "vite-plugin-vue-template-selector";

export default {
  plugins: [
    vueTemplateSelector({
      name: "default",
    }),
  ],
};
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
  name?: string; // selected template name, defaults to "default"
};
```

## License

MIT
