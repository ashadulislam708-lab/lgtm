# Extract Inline Types to Type Files

You are a frontend code organization specialist. Your task is to find and extract all inline `interface` and `type` declarations from source files into centralized `types/*.d.ts` files.

## Scope

Scan both `frontend/` and `dashboard/` apps for inline types in:
- `app/components/**/*.tsx`
- `app/pages/**/*.tsx`
- `app/utils/**/*.ts`
- `app/hooks/**/*.ts`
- `app/redux/**/*.ts`
- `app/services/**/*.ts`

## Exceptions (DO NOT move)

- **Zod-inferred types** (`z.infer<typeof schema>`) — must stay co-located with schema
- **Types derived from local constants** (`typeof CONST[number]`)
- **shadcn/ui internal context types** (e.g., `FormFieldContextValue` in `form.tsx`)
- **Redux store derived types** (`RootState`, `AppDispatch`) in `store.ts`

## Type File Mapping Rules

1. **Domain types** → domain type file (e.g., board types → `types/board.d.ts`)
2. **Component props for domain components** → domain type file
3. **Shared component props** → `types/components.d.ts`
4. **Hook option types** → `types/hooks.d.ts`
5. **Utility parameter/return types** → relevant domain type file or `types/components.d.ts`

## Inline Type Assertions

In addition to `interface`/`type` keyword declarations, also extract **inline type assertions** that use object literal types:

- **Catch block assertions**: `error as { message?: string }` → define a shared `ThunkError` interface in `types/httpService.d.ts`
- **Cast expressions**: `(error as { message: string }).message` → use the same `ThunkError` interface
- **HTTP error assertions**: `err as { response?: { data?: { message?: string }; status?: number } }` → define `HttpCatchError` in `types/httpService.d.ts`
- **Router state assertions**: `location.state as { field: Type; ... }` → define named interfaces in the relevant domain type file
- **Dispatch payload assertions**: `data as { name: string; ... }` → use existing type or define new one in domain type file
- **Inline function parameter types**: `({ prop }: { prop: Type })` on non-exported helper components → extract to component props type file
- **Callback parameter types**: `useCallback(async (data: { name: string; ... }) =>` → extract to named interface in domain type file
- **Props callback parameter types**: `onCreate: (data: { ... }) => void` inside Props interfaces → extract the inline object type to a named interface and reference it

### Exceptions for Inline Assertions

- **Simple primitive casts** (`result.payload as string`, `value as number`) — acceptable, do not extract
- **Generic type parameters** — not inline assertions, leave as-is

## Process

1. **Scan declarations**: Use `rg "^(export )?(interface|type) "` in source directories (excluding `types/`)
2. **Scan assertions**: Use `rg "as \{" --glob '!node_modules/*'` for inline type assertions
3. **Scan cast expressions**: Use `rg "\(.*as \{" --glob '!node_modules/*'` for inline cast patterns
4. **Scan callback parameter types**: Use `rg "\(data:\s*\{" --glob '!node_modules/*'` and `rg "\(values:\s*\{" --glob '!node_modules/*'` for inline callback parameter types
5. **Report**: List all findings organized by target type file
6. **Extract**: Move each type to the appropriate `types/*.d.ts` file with `export`
7. **Import**: Update source files with `import type { ... } from '~/types/...'`
8. **Replace assertions**: Update `as { ... }` patterns to use the new named types
9. **Resolve conflicts**: If two types share a name, prefix with domain (e.g., `TaskFilterType`, `BoardTaskCardProps`)
10. **Cleanup**: Remove duplicate type declarations (e.g., `RootState` in both `store.ts` and `rootReducer.ts`)
11. **Verify**: Run `npm run typecheck && npm run build` for each app

## Output

After completion, report:
- Number of types extracted per app
- New type files created
- Existing type files updated
- Any naming conflicts resolved
- Build verification status
