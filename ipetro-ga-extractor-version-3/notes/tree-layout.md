// extraction/[documentId]/page.tsx
export default function DocumentDetail({ 
  params 
}: { 
  params: { documentId: string }  ← Clear what this is
}) {
  return <div>Document ID: {params.documentId}</div>;
}

// vs using [id]
export default function DocumentDetail({ 
  params 
}: { 
  params: { id: string }  ← What kind of ID?
}) {
  return <div>Document ID: {params.id}</div>;
}
```

## **Full Example Structure:**
```
src/app/
├── layout.tsx
├── page.tsx
│
├── (main)/                              ← Route group
│   ├── layout.tsx                       ← Shared sidebar/header
│   │
│   ├── dashboard/
│   │   └── page.tsx                     → /dashboard
│   │
│   ├── extraction/
│   │   ├── page.tsx                     → /extraction
│   │   ├── new/
│   │   │   └── page.tsx                 → /extraction/new
│   │   └── [documentId]/                ← Dynamic route
│   │       ├── page.tsx                 → /extraction/doc123
│   │       └── edit/
│   │           └── page.tsx             → /extraction/doc123/edit
│   │
│   ├── equipment/
│   │   ├── page.tsx                     → /equipment
│   │   └── [equipmentId]/               ← Dynamic route
│   │       └── page.tsx                 → /equipment/PV-101
│   │
│   └── inspection-plans/
│       ├── page.tsx                     → /inspection-plans
│       └── [planId]/                    ← Dynamic route
│           └── page.tsx                 → /inspection-plans/plan-456
│
└── (auth)/                              ← Another route group
    ├── layout.tsx                       ← Different layout (no sidebar)
    ├── login/
    │   └── page.tsx                     → /login
    └── register/
        └── page.tsx                     → /register
```

## **Other Special Folder Names in Next.js:**
```
(group)/          ← Route group (doesn't affect URL)
[param]/          ← Dynamic route (single segment)
[...slug]/        ← Catch-all route (multiple segments)
[[...slug]]/      ← Optional catch-all route
_component/       ← Private folder (not a route)
@modal/           ← Parallel route
(.)modal/         ← Intercepting route
```

## **Quick Answer:**

✅ **Yes, you can use both:**
- `(main)` - for organizing routes with shared layouts
- `[id]` - for dynamic parameters (but use specific names like `[documentId]` for clarity)

**Recommended:**
```
app/
├── (main)/                    ← Use this
│   └── extraction/
│       └── [documentId]/      ← Use specific names
│           └── page.tsx