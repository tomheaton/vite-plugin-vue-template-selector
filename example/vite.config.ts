import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import vueTemplateSelector from "vite-plugin-vue-template-selector";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vueTemplateSelector({
      name: "default",
    }),
    vue(),
  ],
});
