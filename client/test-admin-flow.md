# Admin Flow Test Guide

## Test Steps

### 1. Test Admin Login Redirect
1. Go to `/login`
2. Login with admin credentials (role: 'admin')
3. Should redirect to `/admin` (not `/dashboard`)

### 2. Test Admin Page Access
1. While logged in as admin, manually navigate to `/admin`
2. Should show admin dashboard with sidebar (no normal header)
3. Should not redirect back to login

### 3. Test Admin Restrictions
1. While logged in as admin, try to access:
   - `/dashboard` - should redirect to `/admin`
   - `/cart` - should redirect to `/admin`
   - `/payment` - should redirect to `/admin`
   - `/` (home) - should work normally

### 4. Test User Login
1. Go to `/login`
2. Login with user credentials (role: 'user')
3. Should redirect to `/dashboard` (not `/admin`)

### 5. Test User Restrictions
1. While logged in as user, try to access:
   - `/admin` - should redirect to `/login`
   - `/admin/users` - should redirect to `/login`
   - `/admin/events` - should redirect to `/login`

## Expected Behavior

### Admin Users:
- ✅ Login redirects to `/admin`
- ✅ Can access all `/admin/*` routes
- ✅ Cannot access user pages (`/dashboard`, `/cart`, `/payment`)
- ✅ Admin pages show only sidebar (no normal header)
- ✅ Admin layout handles authentication

### Regular Users:
- ✅ Login redirects to `/dashboard`
- ✅ Can access user pages (`/dashboard`, `/cart`, `/payment`)
- ✅ Cannot access admin pages (`/admin/*`)
- ✅ User pages show normal header

## Key Changes Made

1. **Login Redirect Logic**: Modified `LoginForm.tsx` to redirect admins to `/admin` and users to `/dashboard`
2. **Admin Layout**: Created `admin/layout.tsx` to handle admin authentication and prevent normal header
3. **Admin Restrictions**: Added admin redirects to user pages (`dashboard`, `cart`, `payment`)
4. **Simplified Admin Pages**: Removed individual authentication checks from admin pages since layout handles it
5. **Password Conflict Prevention**: Ensured same email/phone can exist for admin and user with different passwords

## Files Modified

- `client/src/components/auth/LoginForm.tsx`
- `client/src/app/admin/layout.tsx` (new)
- `client/src/app/admin/page.tsx`
- `client/src/app/admin/users/page.tsx`
- `client/src/app/admin/events/page.tsx`
- `client/src/app/admin/notifications/page.tsx`
- `client/src/app/dashboard/page.tsx`
- `client/src/app/cart/page.tsx`
- `client/src/app/payment/page.tsx`
