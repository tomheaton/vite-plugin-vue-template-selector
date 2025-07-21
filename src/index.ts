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
  name?: string;
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

      if (templates.length === 0) {
        return;
      }

      if (templates.length === 1) {
        return;
      }

      let template = templates.find((t) => t.attrs.name === options.name);
      if (!template) {
        console.warn(`No template found with name "${options.name}" in ${id}`);
        template = templates[0];
      }

      console.log(`Using template "${template.attrs.name}" from ${id}`);

      let transformed = code;
      templates.forEach((template) => {
        transformed = transformed.replace(template.content, "");
      });

      const templateRegex = /<template><\/template>/gi;
      transformed = transformed.replaceAll(templateRegex, "");

      const templateRegexWithName = /<template name="[^"]+"><\/template>/gi;
      transformed = transformed.replaceAll(templateRegexWithName, "");

      const finalCode =
        `<template>\n${template.content.trim()}\n</template>\n\n` +
        transformed.trim();

      console.log(`Transformed code for ${id}:\n${finalCode}`);

      return {
        code: finalCode,
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
