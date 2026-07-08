@AGENTS.md

- when writing components, never use default exports, always use named exports
- in app code, don't import styled primitives directly from `react-aria-components` when a wrapper exists in `@/client/components/ui` — use the wrapper. Wrappers exist for `Button`, `ToggleButton`, `Menu`/`MenuItem`, `Modal`, `TextField`, and `Tabs`/`TabList`/`TabPanel`/`Tab`. For bespoke, off-palette styling use `variant="unstyled"` on the UI `Button` and pass `className`. Importing raw react-aria primitives is only allowed for structural pieces that have no wrapper (e.g. `DialogTrigger`, `MenuTrigger`, `Popover`, `Separator`, `Heading`, `Toolbar`, `Form`).
