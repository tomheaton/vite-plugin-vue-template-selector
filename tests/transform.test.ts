import type { Plugin } from "vite";
import { describe, expect, it } from "vitest";
import vueTemplateSelector, { type Options } from "../src/index";

const fakeContext = {
  command: "build",
} as any;

function runTransform(code: string, options: Options) {
  const plugin = vueTemplateSelector(options) as Plugin;
  if (!plugin.transform) {
    throw new Error("Transform hook is not defined");
  }

  const handler =
    typeof plugin.transform === "function"
      ? plugin.transform
      : plugin.transform.handler;

  return handler.call(fakeContext, code, "Component.vue")?.code;
}

describe("basic behaviour", () => {
  it("returns undefined for an empty file", () => {
    const code = ``;
    const output = runTransform(code, { name: "default" });
    expect(output).toBeUndefined();
  });

  it("transforms a simple template", () => {
    const code = `<template><div>Hello</div></template>`;
    const output = runTransform(code, { name: "default" });
    expect(output).toContain("<div>Hello</div>");
  });
});

describe("multiple templates", () => {
  const base = `
<template name="default">
  <div>Default Template</div>
</template>

<template name="alternative">
  <div>Alternative</div>
</template>
  `.trim();

  it("uses the default template", () => {
    const output = runTransform(base, { name: "default" });
    expect(output).toContain("<div>Default Template</div>");
    expect(output).not.toContain("<div>Alternative</div>");
  });

  it("uses the alternative template", () => {
    const output = runTransform(base, { name: "alternative" });
    expect(output).toContain("<div>Alternative</div>");
    expect(output).not.toContain("<div>Default Template</div>");
  });

  it("falls back to first template when name not found", () => {
    const output = runTransform(base, { name: "nonexistent" });
    expect(output).toContain("<div>Default Template</div>");
  });
});

describe("nested <template> tags inside real templates", () => {
  const code = `
<template name="default">
  <div>
    <template v-if="true"><span>Hello</span></template>
  </div>
</template>

<template name="alternative">
  <p>Alternative</p>
</template>
`.trim();

  it("preserves nested <template> tags", () => {
    const output = runTransform(code, { name: "default" });
    expect(output).toContain(
      `<template v-if="true"><span>Hello</span></template>`,
    );
    expect(output).not.toContain("<p>Alternative</p>");
  });
});

describe("empty template edge cases", () => {
  it("uses first template if config has no name", () => {
    const code = `
<template name="default"></template>
<template name="fallback"></template>
    `.trim();

    const output = runTransform(code, {});
    expect(output).toContain("<template>");
  });

  it("throws on multiple unnamed templates (duplicates)", () => {
    const code = `
<template></template>
<template></template>
    `.trim();

    expect(() => runTransform(code, {})).toThrow(
      /Duplicate <template name="<unnamed>">/,
    );
  });

  it("throws on duplicate template names", () => {
    const code = `
<template name="foo"></template>
<template name="foo"></template>
    `.trim();

    expect(() => runTransform(code, {})).toThrow(
      /Duplicate <template name="foo">/,
    );
  });

  it("uses fallback template when primary not found", () => {
    const code = `
<template name="alternative">
  <div>Alternative</div>
</template>
<template name="fallback">
  <div>Fallback</div>
</template>
`.trim();

    const output = runTransform(code, {
      name: "missing",
      fallback: "fallback",
    });

    expect(output).toContain("Fallback");
    expect(output).not.toContain("Alternative");
  });

  it("throws if strict and neither primary nor fallback found", () => {
    const code = `
<template name="foo">
  <div>Foo</div>
</template>
`.trim();

    expect(() =>
      runTransform(code, {
        name: "missing",
        fallback: "also-missing",
        strict: true,
      }),
    ).toThrow(
      /No template found with name "missing" or fallback "also-missing"/,
    );
  });

  it("throws if strict and primary not found and no fallback", () => {
    const code = `
<template name="foo">
  <div>Foo</div>
</template>
`.trim();

    expect(() => runTransform(code, { name: "missing", strict: true })).toThrow(
      /No template found with name "missing"/,
    );
  });
});
