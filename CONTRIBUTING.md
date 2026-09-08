# Contributing to Aion

Bug reports, documentation improvements and focused pull requests are welcome.
For a new feature or a public API change, open an issue first to discuss the use case.

## Report an issue

Use [GitHub Issues](https://github.com/Adoratorio/aion/issues). Include the package version,
your runtime or browser, a minimal reproduction, and the expected and actual behavior.

## Local development

Clone your fork and use Node.js 24 with the pnpm version declared in `package.json`.
From the repository root, run:

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm test:package
```

`pnpm check` runs typechecking, linting and formatting checks. Use `pnpm format`
to apply formatting. `pnpm test:package` installs the built archive in a temporary
consumer project and checks imports, declarations and source maps.

## Scope and validation

Keep changes focused. Add a regression test for bug fixes and update examples when
the public API changes. Preserve public exports, including supported `dist` subpaths.

Cover frame scheduling, callback order, callback errors, handler IDs and stop/start transitions. Preserve the shared frame queue and existing timing defaults. Cancel scheduled frames and restore mocks after each test. Verify animation timing in a browser when changing the scheduling loop.

## Pull requests

Describe the problem, the resulting behavior and how you verified it. Include any
compatibility impact and add user-facing changes to `Unreleased` in `CHANGELOG.md`.
A current maintainer other than the author should review each change; maintainers
are listed in the [README](README.md#maintainers).

## Releases

Maintainers coordinate the version and release owner. Before publishing, run the
checks above, confirm dependency versions are available, and move the relevant
`Unreleased` notes into a dated version entry.

Release notes should explain the user impact, identify breaking changes and give
concrete upgrade steps. Keep titles and headings plain, without emoji. Use the
changelog as the source for release notes and link to the relevant comparison.

CI validates changes; publishing is a separate maintainer operation.
