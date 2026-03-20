# GitHub Copilot Instructions for React Project

**Purpose:**
This document tells GitHub Copilot how to generate code suggestions that match this React project's style and rules. Copilot should prefer suggestions that already pass linting/formatting (ESLint + Prettier) and follow `ecmaVersion: 2022`.

---

## 1 — Top-level rules for suggestions

- Always prefer **functional components** and **React Hooks** (no class components).
- Use **`const`** by default; use `let` only if reassignment is required.
- Use **arrow functions** for component declarations, event handlers, and utility functions where concise syntax helps readability.
- Keep code compatible with **ECMAScript 2022** features (set `parserOptions.ecmaVersion = 2022`).
- Suggestions must follow the project’s ESLint + Prettier configuration (see sections below).
- Prefer small, single-responsibility components and reusable hooks.
- Favor **explicit prop typing** for public components when TypeScript is used, but do not add verbose `explicit-module-boundary-types` when unnecessary (project rule: that rule is turned off).
- Always include **accessibility attributes** where relevant (e.g., `aria-label`, `role`, `aria-hidden`, keyboard handlers).
- Add **JSDoc** for complex functions or components (brief, clear, one-line `@param`/`@returns` when needed).

---

## 2 — Formatting & linting (what Copilot should produce)

Use the provided Prettier and ESLint rules as the canonical formatter/linter:

### Prettier (project-preferred)

```json
{
  "arrowParens": "always",
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "jsxSingleQuote": false,
  "printWidth": 100,
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "all",
  "useTabs": false,
  "endOfLine": "auto"
}
```

### ESLint + TypeScript base (important highlights)

- Parser: `@typescript-eslint/parser`
- Extends: `plugin:react/recommended`, `plugin:@typescript-eslint/recommended`, `plugin:react/jsx-runtime`, `plugin:prettier/recommended`, `prettier`
- Plugins: `prettier`, `@typescript-eslint`
- Important rules (use these to influence suggestions):

  - `"react/prop-types": "off"` (use TypeScript types instead of prop-types)
  - `"@typescript-eslint/ban-ts-comment": "off"`
  - `"@typescript-eslint/no-shadow": "warn"`
  - `"prettier/prettier": ["warn", { "endOfLine": "auto" }]`
  - `"@typescript-eslint/explicit-module-boundary-types": "off"`
  - `"react/display-name": "off"`

**Copilot should prefer code that is valid under the above ESLint config and formatted by Prettier.**

---

## 3 — TypeScript & typing guidance

- Use TypeScript where the project uses it. Prefer `React.FC<Props>` **only** if the team prefers it—otherwise use plain arrow function components with props typed:
  `const MyComponent = ({ foo }: MyProps) => { ... }`
- Do not add unnecessary runtime prop-type libraries; rely on TypeScript types.
- Avoid overly broad `any`; prefer specific types or generics. Use `unknown` if you must defer typing.
- `@ts-ignore` is allowed only when necessary and accompanied by a short comment explaining why.

---

## 4 — Component & hook style (examples Copilot should follow)

**Preferred functional component style**

```tsx
/**
 * Button with accessible label and click handler
 *
 * @param {ButtonProps} props
 */
type ButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const Button = ({ label, onClick, disabled = false }: ButtonProps) => {
  return (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};

export default Button;
```

**Preferred custom hook**

```ts
const useDebouncedValue = <T>(value: T, delay = 300) => {
  const [debounced, setDebounced] = React.useState<T>(value);

  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

export default useDebouncedValue;
```

Notes for Copilot:

- Use clear variable names.
- Prefer `React.useEffect`, `React.useMemo`, `React.useCallback` to keep imports explicit only when not using the new JSX runtime auto-import pattern (the ESLint config includes `plugin:react/jsx-runtime` so auto-import is enabled).
- When generating event handlers, return typed handlers for TypeScript projects: `(e: React.ChangeEvent<HTMLInputElement>) => void`.

---

## 5 — Accessibility & semantics

- Use semantic HTML (`<button>`, `<nav>`, `<header>`, `<main>`, `<footer>`) when applicable.
- Always include accessible names for controls — `aria-label`, `aria-labelledby`, visible text, or `aria-hidden` when intentionally hidden.
- Keyboard navigation: ensure interactive elements are keyboard-focusable and handle key events (Enter/Space for custom controls).
- For dynamic content changes provide roles (e.g., `role="status"`) or ARIA live regions if needed.

---

## 6 — File / pattern-specific behavior

- **Stories (`*.stories.*`)**: suggestions may be more permissive (mock data, simpler typing). The ESLint override disables `explicit-module-boundary-types` for stories; Copilot may omit return types there.
- **Tests (`*.test.*`, `*.spec.*`)**: prefer readable, maintainable tests. Use `jest` / `testing-library/react` patterns (render, screen, userEvent). Tests may use `async/await` for flows and should assert accessibility roles where applicable.
- **Utils / small helpers**: keep side-effect-free and pure where possible. Add JSDoc for non-obvious algorithms.
- **API calls / network code**: create an abstraction (e.g., `apiClient`) and handle errors with typed responses; use `fetch` or `axios` depending on project standard. Always handle JSON parse errors and non-2xx responses.

---

## 7 — JSDoc and inline comments

- For any nontrivial functions/components, include a short JSDoc summary plus `@param` and `@returns` where helpful.
- Keep comments concise and explain _why_, not _what_, unless the what is complicated.

Example:

```ts
/**
 * Returns a cached value for a key or fetches it using `fetcher`.
 * @param key cache key
 * @param fetcher async function that returns the value when not cached
 */
const getCached = async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => { ... }
```

---

## 8 — Tests, Storybook & docs

- When generating components, generate at least a simple Storybook story (`Component.stories.tsx`) if Storybook exists in the repo.
- Generate unit tests that assert rendered output, accessibility roles, and basic interactions.
- If generating new public APIs, add a short README or update docs (use markdown) describing usage and props.

---

## 9 — Commit messages & PR descriptions (suggestion style)

- Suggest concise commit messages in the format: `feat(component): add <component-name>` or `fix(api): handle non-2xx responses`.
- For PR descriptions, include: summary, what changed, why, and any migration notes or visual changes.

---

## 10 — What to avoid (explicit "do not")

- Do not generate class components.
- Do not generate code that violates the Prettier or ESLint rules above.
- Do not use `var`.
- Do not add long, unnecessary inline styles — prefer class names or styled systems used by the project.
- Do not produce network credentials, secrets, or sensitive data in code examples.

---

## 11 — Example prompt templates (how to ask Copilot in-file)

Use these short templates as in-file comments to bias suggestions:

- `// Copilot: create a functional component named UserCard that accepts UserProps and renders avatar, name, and email with proper aria attributes. Use TypeScript.`
- `// Copilot: write a custom hook useFetch<T>(url: string) that returns { data, loading, error } and is typed. Handle cancellation on unmount.`
- `// Copilot: create jest + testing-library tests for UserCard: render, accessibility role 'article', click event on action button.`

---

## 12 — Integration checklist (quick)

When Copilot completes a snippet, ensure the following before committing:

- [ ] Compiles under TypeScript (if repo uses TS).
- [ ] Passes ESLint with project config (or addresses warnings the team tolerates).
- [ ] Is formatted by Prettier (matches project `.prettierrc`).
- [ ] Includes minimal but sufficient JSDoc for complex parts.
- [ ] Handles accessibility basics (labels, roles, keyboard).
- [ ] Includes unit test or story when adding a user-visible component.

---

## 13 — Quick reference: coding-standard summary

- ECMAScript: **2022**
- Prefer: `const`, arrow functions, hooks, semantic HTML, TypeScript types
- Lint/Format: use supplied **ESLint + Prettier** config (see above)
- Accessibility: required for interactive components
- Docs: JSDoc + story/test for new components