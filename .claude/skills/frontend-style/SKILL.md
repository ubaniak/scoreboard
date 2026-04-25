---
name: frontend-style
description: when developing a front-end feature follow this style guide
---

# frontend-style

You are helping the user add or modify React/TypeScript frontend code in the scoreboard project. Apply the patterns below exactly. Read existing files before writing anything new.

---

## Directory layout

```
src/
  api/           ← one file per domain, all React Query hooks + type exports
  entities/      ← shared TypeScript types (mirrors backend response shapes)
  pages/         ← one file per route, data-fetching only (no markup)
  components/    ← UI, grouped by domain folder
  layouts/       ← page shell components (PageLayout, AppLayout, etc.)
  providers/     ← React context (login, timer)
  hooks/         ← shared custom hooks
```

---

## Component rules

**Small and single-use.** Each component file does one thing. If a component is getting large, split it: extract a named sub-component into its own file in the same folder. Do not define multiple exported components in one file. Do not build generic/reusable abstractions unless the same markup is genuinely needed in 3+ places.

**No data fetching inside components.** All `useQuery` / `useMutation` calls live in the page or in a component that is explicitly a "container" (rare). Regular UI components receive data and callbacks as props only.

**Props type at the top of the file, unexported:**

```tsx
type FooProps = {
  name: string;
  onSubmit: (value: string) => void;
};

export const Foo = ({ name, onSubmit }: FooProps) => { … };
```

**Scoreboard / public display components** (under `components/current/`) use inline `style` objects — no Ant Design. Admin UI components use Ant Design.

---

## API layer (`src/api/<domain>.ts`)

One file per backend domain. Structure:

```ts
// 1. query key factory (keeps invalidation consistent)
const keys = {
  all: (token: string) => ["domain", token] as const,
  list: (token: string) => [...keys.all(token), "list"] as const,
  get: (token: string, id: string) =>
    [...keys.all(token), `get-${id}`] as const,
};

// 2. query hooks — useGet*, useList*
export const useListFoos = (props: TokenBase) =>
  useQuery({
    queryKey: keys.list(props.token),
    enabled: !!props.token,
    queryFn: () =>
      fetchClient<Foo[]>(`${baseUrl}/api/foos`, {
        headers: { Authorization: `Bearer ${props.token}` },
      }),
  });

// 3. mutation hooks — useMutate*
export const useMutateCreateFoo = (props: TokenBase) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateFooProps) =>
      fetchClient(`${baseUrl}/api/foos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${props.token}`,
        },
        body: JSON.stringify(body),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: keys.list(props.token) }),
  });
};
```

- Always pass `Authorization: Bearer ${token}` in headers.
- `Content-Type: application/json` only for JSON bodies — omit it for `FormData`.
- `onSuccess` invalidates the narrowest relevant key (prefer `keys.list` over `keys.all`).
- Export the input shape type alongside its mutation hook: `export type CreateFooProps = { … }`.
- Props types for hooks use intersections of shared types from `src/api/entities.ts`:
  `TokenBase`, `CardRequestType`, `BoutRequestType`, `RoundRequestType`.

---

## Entities (`src/entities/<domain>.ts`)

Plain TypeScript types mirroring backend JSON response shapes. No classes, no methods. Optional fields use `?`, never `| undefined` explicitly.

```ts
export type Foo = {
  id: string;
  name: string;
  status: FooStatus;
  imageUrl?: string;
};

export type FooStatus = "active" | "completed";
```

---

## Pages (`src/pages/<name>.tsx`)

Pages are the only place that call hooks from `src/api/`. They assemble data and pass it down as props. Keep pages thin — no significant markup, no business logic beyond wiring callbacks.

```tsx
export const FooPage = () => {
  const { token } = useProfile();
  const foos = useListFoos({ token });
  const createFoo = useMutateCreateFoo({ token });

  return (
    <PageLayout
      title="Foos"
      breadCrumbs={[{ title: <a href="/">home</a> }, { title: "foos" }]}
    >
      <FooList
        foos={foos.data ?? []}
        loading={foos.isLoading}
        onCreate={(v) => createFoo.mutate(v)}
      />
    </PageLayout>
  );
};
```

- Route params: `const { cardId } = useParams({ strict: false })`.
- Get auth: `const { token } = useProfile()`.
- New routes are registered in `src/App.tsx` as `createRoute(…)` entries.

---

## Layouts

Use `PageLayout` for standard admin pages:

```tsx
<PageLayout
  title="Page Title"
  subTitle={<SomeSummaryComponent />}
  action={<SomeActionButtons />}
  breadCrumbs={[{ title: <a href="/">home</a> }, { title: "current" }]}
>
  {/* page body */}
</PageLayout>
```

Scoreboard / public display routes get a full-screen fixed-inset `div` with `background: "#0b0f1a"` — no `PageLayout`.

---

## Naming conventions

| Thing            | Convention                               |
| ---------------- | ---------------------------------------- |
| Query hook       | `useGet<Entity>`, `useList<Entities>`    |
| Mutation hook    | `useMutate<Verb><Entity>`                |
| Component        | PascalCase matching the filename         |
| Props type       | `<ComponentName>Props`, unexported       |
| Page component   | `<Name>Page`                             |
| Entity type file | lowercase singular: `bout.ts`, `card.ts` |
| API file         | lowercase plural: `bouts.ts`, `cards.ts` |

---

## What NOT to do

- Do not call `useQuery` or `useMutation` inside a UI component — only in pages.
- Do not put multiple exported components in one file.
- Do not build a generic reusable component for something only used once.
- Do not use Ant Design in scoreboard/public display components (`components/current/`).
- Do not add `Content-Type: application/json` when the body is `FormData`.
- Do not reach into a sibling domain's entity type directly — import from `src/entities/`.
- Do not add `useState` for data that comes from the server — that's what React Query is for.
