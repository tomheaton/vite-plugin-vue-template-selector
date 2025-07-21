import {
  createRoot,
  NodeTypes,
  parse,
  type CompilerError,
  type ElementNode,
} from "@vue/compiler-dom";
import type { Plugin } from "vite";
import { type SFCTemplateBlock } from "vue/compiler-sfc";

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

export default function vueTemplateSelector(options: Options = {}): Plugin {
  return {
    name: "vite-plugin-vue-template-selector",
    transform(code: string, id: string) {
      if (!id.endsWith(".vue")) {
        return;
      }

      const errors: CompilerError[] = [];

      const ast = parse(code, {
        parseMode: "sfc",
        prefixIdentifiers: true,
        onError: errors.push,
      });

      if (errors.length) {
        throw new Error(
          `Failed to parse Vue file "${id}":\n` +
            errors.map((e) => `- ${e.message}`).join("\n"),
        );
      }

      const templates: SFCTemplateBlock[] = [];

      ast.children.forEach((node) => {
        if (node.type !== NodeTypes.ELEMENT) {
          return;
        }

        if (node.tag !== "template") {
          return;
        }

        const templateBlock = createTemplateBlock(node, code);

        if (!templateBlock.attrs.src) {
          templateBlock.ast = createRoot(node.children, code);
        }

        templates.push(templateBlock);
      });

      // no templates found, let Vite handle it
      if (templates.length === 0) {
        return;
      }

      // check for duplicate template names
      const nameCounts = templates.reduce(
        (acc, t) => {
          const name =
            typeof t.attrs.name === "string" ? t.attrs.name : "<unnamed>";
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      for (const [name, count] of Object.entries(nameCounts)) {
        if (count > 1) {
          throw new Error(`Duplicate <template name="${name}"> found in ${id}`);
        }
      }

      templates.forEach((t) => {
        if (!t.attrs.name) {
          console.warn(
            `Unnamed <template> found in ${id}; consider adding a name.`,
          );
        }
      });

      // TODO: validate options?
      const { name, fallback, strict = false } = options;

      let template = templates.find((t) => t.attrs.name === name);

      if (!template && fallback) {
        template = templates.find((t) => t.attrs.name === fallback);
        if (!template && strict) {
          throw new Error(
            `No template found with name "${name}" or fallback "${fallback}" in ${id}`,
          );
        }
      }

      if (!template && strict) {
        throw new Error(`No template found with name "${name}" in ${id}`);
      }

      if (!template) {
        console.warn(
          `No template found with name "${name}" in ${id}, falling back to first template`,
        );
        template = templates[0];
      }

      // Remove all templates by slicing them out based on location, in descending order of start offsets
      const sortedTemplates = templates
        .slice()
        .sort((a, b) => b.loc.start.offset - a.loc.start.offset);

      let transformed = code;
      for (const { loc } of sortedTemplates) {
        transformed =
          transformed.slice(0, loc.start.offset) +
          transformed.slice(loc.end.offset);
      }

      const finalCode =
        `<template>\n${template.content.trim()}\n</template>\n\n` +
        // `<template>${template.content.trim()}</template>` +
        transformed.trim();

      return {
        code: finalCode,
        // TODO: generate source map?
        sourceMap: null,
      };
    },
  };
}

/**
 * Creates a template block from a Vue element node.
 *
 * Modified from https://github.com/vuejs/core/blob/main/packages/compiler-sfc/src/parse.ts#L314
 */
function createTemplateBlock(
  node: ElementNode,
  source: string,
): SFCTemplateBlock {
  const loc = node.innerLoc!;
  const attrs: Record<string, string | true> = {};

  const block: SFCTemplateBlock = {
    type: "template",
    content: source.slice(loc.start.offset, loc.end.offset),
    loc,
    attrs,
  };

  node.props.forEach((p) => {
    if (p.type !== NodeTypes.ATTRIBUTE) {
      return;
    }

    attrs[p.name] = p.value ? p.value.content || true : true;
  });

  return block;
}
