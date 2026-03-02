# Team Corrections

Common mistakes to avoid across all projects.
These are team-wide anti-patterns and corrections.

---

## Scope

This file contains mistakes that should be avoided in **ALL projects**:
- Common anti-patterns
- Deprecated approaches
- Team-wide "don't do this" rules

---

## Entries

<!-- Team corrections are appended below this line -->

### 2026-01-28: User Entity Does NOT Have slug Field

**Type**: correction
**Confidence**: HIGH
**Source**: Session reflection - design-flow project

**Description**: The `User` entity in this codebase does NOT have a `slug` column. The auth.service.ts had code that tried to set `slug` when creating new users via social login, causing database errors.

**What NOT to do**:
```typescript
// WRONG - slug field doesn't exist
const newUserData = {
    slug: await this.getNextAvailableSlug(),
    fullName: data.fullName,
    ...
};
```

**What to do instead**:
```typescript
// CORRECT - don't include slug
const newUserData = {
    fullName: data.fullName,
    email: data.email,
    ...
};
```

---
