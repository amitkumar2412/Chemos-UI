# Permission System Spec

## Current implementation

The admin screen is available at **Admin > Roles & Permissions** (`/admin/permissions`).
Both the menu entry and page require the exact `ROLE_MANAGEMENT` permission from
the existing `/api/v1/auth/me` configuration response. A role name alone does not
grant access to this screen.

- **Role Permissions** loads the permission catalog and roles from `/auth/permissions`
  and `/auth/roles`, then loads the selected role from `/auth/roles/{roleId}/permissions`.
  Parent options follow a fixed hierarchy (by role name): Purchase Manager and Sales
  Manager → Admin; Purchase Executive → Purchase Manager; Sales Executive → Sales Manager.
  Other roles may choose any non-super role that doesn't create a cycle. "None" is always
  available. Admin is a super role, so with Admin as parent the inheritance mode is
  locked to None (the backend rejects ALL/SELECTED from a super role).
  Changing the parent fetches its current direct permissions and removes invalid selections.
  `NONE` inherits nothing, `ALL` inherits only parent direct grants, and `SELECTED`
  inherits the selected subset of those direct grants. Grandparent grants never flow down.
- Saving shows an effective-grant additions/removals confirmation, then sends a full
  `PUT /auth/roles/{roleId}/permissions` with `parentRoleId` (null for no parent),
  `inheritanceMode`, `permissions`, and `selectedInheritedPermissions`.
  The selected list is empty outside `SELECTED` mode. The returned role is authoritative.
- **User Permissions** searches `/auth/users` by name, username or role. Selecting a
  user fetches `/auth/users/{username}/permissions`. The user can check **Allow**
  or **Deny** for a permission; leave both unchecked to use the role default.
  Checking Allow/Deny sends `PUT /auth/users/{username}/permission-overrides/{permissionCode}`
  with an optional reason; unchecking the active override sends DELETE only when one exists.
  The two choices are mutually exclusive.
  Every successful mutation refetches the user's breakdown before displaying effective access.
  If that refresh fails after a successful write, the editor requires a reload rather than
  showing stale grants as current.
- Standard permissions appear in a matrix with modules as rows and View, Create,
  Edit and Approve as columns. Standard cells display only checkboxes, without cards,
  permission names/codes, or access-status text. The Module column is 105px wide
  (90px on mobile). Permission names/codes are available on hover, and each checkbox
  has an accessible name. Role checkboxes edit direct grants; a second checkbox in
  SELECTED mode edits inheritance, while ALL shows inherited grants as read-only
  checked boxes. User cells have Allow then Deny checkboxes; the explanation above
  the table describes their order. Other permissions use the same compact style:
  a narrow table with Module, Permission name and an Access checkbox column.
  Dashboard, management and multi-part codes such as `STOCK_STATS_VIEW`
  appear in a separate Other permissions section.
- Permission codes and labels come from the catalog, never permission IDs. Each
  permission is rendered individually, including multiple permissions with the same
  action and module.
- Super roles and their users show all catalog permissions as granted and cannot be edited.
- Requests use the existing API client's bearer token handling. A 401 clears the session
  and redirects to login; a 403 displays **Not authorized**. Other errors show the
  backend message when available.

Backend changes take effect on the next request. Menus and buttons refresh when the
affected user logs in again or reloads configuration; a save notice explains this.
The existing `user`, `permissions`, and `modules` configuration shape is unchanged.
Purchase/sales Create and Edit controls use the corresponding module flags;
the order-management screen also gates Confirm/Unconfirm/Cancel with `canApprove`
and editing/data-update actions with `canEdit`, including confirmed orders.
Existing status-based editing restrictions on the purchase/sales lists remain in place.

Run `npm run test:permissions` for catalog grouping, inheritance, parent-cycle prevention,
effective diffs, access gating, full replacement payloads, encoded endpoints, and HTTP
error/session handling checks. Run `npx tsc --noEmit` and `npm run build` for type/build validation.

## Historical proposal (superseded)

The proposal below predates the implemented backend contract. Its dotted permission
keys and proposed login/me payloads are not the current API. Current permission codes
are used exactly as returned by the backend catalog.

## Context

Today, access control in chemos-app (frontend) is based on a single `role` string per user (e.g. `"ADMIN"`, `"PURCHASE_MANAGER"`), and the frontend guesses what a role can do by substring-matching the role name (e.g. `role.includes('ADMIN')`). This doesn't support **user-specific permission overrides** on top of a role, and it hardcodes role-name assumptions into the frontend.

We want to move to: **role permissions + per-user overrides, merged into one effective permission set, computed by the backend and sent to the frontend.** The frontend will only ever ask "does this user have permission X?" — it will not guess based on role names.

## Data model

Two things need to exist (as DB tables or however fits your current schema):

1. **Role → permissions** — each role has a set of permission keys (e.g. `PURCHASE_MANAGER` → `["purchase.view", "purchase.create", "purchase.edit"]`).
2. **User → permission overrides** — each user can have individual overrides on top of their role, each with an effect of `ALLOW` or `DENY`.

### Merge rule (precedence)

```
effective_permissions(user) =
    ( permissions(user.role) ∪ user.overrides[ALLOW] )  −  user.overrides[DENY]
```

In words: start with the role's permissions, add anything the user was explicitly granted beyond their role, then remove anything the user was explicitly denied. **An explicit user-level DENY always wins**, even if the role would normally allow it.

The frontend does not need to know about roles or overrides separately — it only ever receives the final merged list.

## API contract changes

### 1. `POST /auth/login` (existing) — add a `permissions` field to the response

```json
{
  "username": "asha",
  "role": "PURCHASE_MANAGER",
  "token": "eyJhbGciOi...",
  "permissions": [
    "purchase.view",
    "purchase.create",
    "purchase.edit",
    "sale.view"
  ]
}
```

### 2. `GET /auth/me` (new, recommended)

Same shape as above minus `token`, callable with the existing bearer token. Lets the frontend refresh a user's permissions mid-session (e.g. an admin changes their role/overrides without forcing a re-login).

```json
{
  "username": "asha",
  "role": "PURCHASE_MANAGER",
  "permissions": ["purchase.view", "purchase.create", "purchase.edit", "sale.view"]
}
```

### 3. `GET /auth/roles` (existing) — optionally extend with default permissions per role

Not required for phase 1, but useful if an admin UI for editing role permissions is built later:

```json
{
  "id": "role_123",
  "name": "PURCHASE_MANAGER",
  "displayName": "Purchase Manager",
  "permissions": ["purchase.view", "purchase.create", "purchase.edit"]
}
```

## Permission key naming convention

`resource.action`, lowercase, dot-separated. Proposed starting set, based on the pages that exist today — please review/adjust with frontend before finalizing:

| Key | Meaning |
|---|---|
| `purchase.view` | See purchase orders |
| `purchase.create` | Create a purchase order |
| `purchase.edit` | Edit a purchase order |
| `purchase.confirm` | Confirm a purchase order |
| `purchase.cancel` | Cancel a purchase order |
| `sale.view` | See sale orders |
| `sale.create` | Create a sale order |
| `sale.edit` | Edit a sale order |
| `sale.confirm` | Confirm a sale order |
| `sale.cancel` | Cancel a sale order |
| `purchase_sale_link.view` | View purchase-sale links |
| `purchase_sale_link.edit` | Edit purchase-sale links |
| `audit.view` | View audit log |
| `users.view` | View user list |
| `users.manage` | Create/edit/deactivate users, assign roles/overrides |

## Out of scope for this phase

Row-level / conditional permissions (e.g. "can edit only purchases they created") are **not** covered by this model — it only expresses "can do X in general," not "can do X to this specific record." If that's needed later, flag it early since it changes the shape of `permissions` from a flat string list to a list of `{ key, condition }` rules.

## What the frontend will do with this

- Store the `permissions` array from login/`/auth/me` alongside the existing `role` in its session state.
- Add a single `can(permissionKey)` check used everywhere instead of today's ad-hoc role-string matching.
- This is UX-only — the backend must still enforce the same permission checks on every API endpoint regardless of what the frontend shows/hides.
