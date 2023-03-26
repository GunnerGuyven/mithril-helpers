# Mithril Helpers

This is a collection of utility methods and building blocks for developing applications rapidly using [Mithril.js](https://mithril.js.org/) as the renderer.

- `0.1.0` 2023-03-26 : Initial release

## Goals

Components provided should be reasonably close to the accepted standard mithril style and not be overly specialized in styling, behavior, or usage.  Functional composition will be favored where possible to achieve specialized results.

Part of this endeavor is in learning Typescript and providing a smooth integration for non-typescript projects' consumption.  Clean standards for project design and management will be favored when options of that sort are considered.

Support for multiple styling systems (`bulma`, `bootstrap`, `tailwind` as some examples) is desired.  A strategy to accomplish this hasn't been decided on yet, but there will probably be some layering of render outcomes based on the wants of the consuming project.

Output should be oriented toward modularity, minimalism, and support for tree-shaking.  All exported symbols should be well documented including arguments, properties, and any non-obvious caveats.

## Tools

Currently favored package manager is `pnpm` but that is open to reconsideration and usage of other package managers will be allowed and supported when not disruptive.

Typescript is the language of choice.  Prettier and ESLint the formatter and linter respectively.