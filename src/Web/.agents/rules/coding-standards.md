---
name: react-chakra-solid-rules
description: Strict rules for React + TypeScript + Chakra UI development following SOLID, DRY, and existing linting configs.
---

# Frontend Excellence: React, TypeScript, & Chakra UI

## 🎯 High-Level Principles
- **Reliability**: Code MUST build and run without errors. Run `npm run build` or `tsc` to verify before finishing.
- **SOLID & DRY**: Apply these principles strictly. Favor composition over inheritance and extract reusable logic into hooks.
- **Simplicity**: Prefer "boring," readable code over clever, complex solutions.

## 🛠️ Tech Stack & Standards
### 1. React & TypeScript
- Use **Functional Components** and **Hooks** exclusively.
- **Strict Typing**: No `any`. Use interfaces for props and centralize shared types in `types/`.
- **Component Structure**: Export a single component per file.

### 2. Chakra UI
- Use **Chakra UI components** for all layout and UI needs.
- **Style Props**: Prefer Chakra's style props (e.g., `px={4}`, `bg="blue.500"`) over external CSS or inline styles.
- **Theming**: Use the project's `theme.ts` tokens for colors, spacing, and typography to ensure consistency.

### 3. Linting & Formatting (CRITICAL)
- **Automatic Compliance**: You MUST read and follow the project's `eslint.config.js` and `.prettierrc` (or similar config files).
- **No Overrides**: Do not add `eslint-disable` comments unless explicitly requested.
- If a change causes a linting error, you must fix the code, not the rule.

## 🏗️ Architecture
- **Feature-Driven**: Group files by feature (e.g., `features/auth/components/`) rather than type.
- **Data Fetching**: Keep logic out of components; use custom hooks or libraries like TanStack Query.
- **State Management**: Use local state (`useState`) by default; escalate to Context or Zustand only when necessary.

## ✅ Verification Checklist
Before submitting changes, verify:
1. No TypeScript errors in the modified files.
2. Code matches the existing Prettier/ESLint formatting.
3. No code duplication (DRY principle).
4. The application starts and the modified feature works as expected.