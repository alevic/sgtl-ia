---
description: Phase 3 - Client Authentication & Integration
---

# Phase 3: Client Authentication & Integration

## Goal
Implement authentication for the Client Portal (B2C users) and link them to the CRM `clients` table.

## Steps

1.  **Define Client Role**
    -   We will use the role string `'client'` for portal users.
    -   Admin users have roles `'admin'`, `'operacional'`, etc.

2.  **Implement Client Signup Endpoint**
    -   Create `POST /api/public/client/signup` in `server/routes/public.ts`.
    -   This endpoint should:
        -   Accept `name`, `email`, `password`, `phone`, `document`.
        -   Create a user in `better-auth` (using `auth.api.signUpEmail` or direct DB insert if needed).
        -   Create a record in `clients` table linked to the user.
        -   Return the session or success message.

3.  **Implement Client Login Endpoint**
    -   The standard `better-auth` login (`/api/auth/sign-in/email`) can be used.
    -   However, we might need to ensure that when a `'client'` logs in, they are redirected to the portal, not the admin panel.
    -   The frontend handles redirection based on role.

4.  **Link Auth User to Client Profile**
    -   Ensure the `clients` table has a `user_id` column to link to the `user` table.
    -   Update `setup-db.ts` if `user_id` is missing in `clients`.

5.  **Secure Client Routes**
    -   Create a middleware `authorizeClient` (similar to `authorize`) that checks if the user has role `'client'`.

## Implementation Details

### Database Updates
-   Check `clients` table for `user_id`.

### Backend Routes
-   Modify `server/routes/public.ts` to add signup logic.
