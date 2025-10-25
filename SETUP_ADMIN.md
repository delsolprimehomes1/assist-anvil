# Creating Your First Admin User

After Phase 1 is complete, you'll need to create an admin user to access the Admin Dashboard.

## Step 1: Sign Up
1. Navigate to `/auth` in your application
2. Click on the "Sign Up" tab
3. Enter your details:
   - Full Name
   - Email
   - Password (minimum 6 characters)
4. Click "Create Account"

## Step 2: Promote to Admin
After signing up, you need to manually promote your account to admin using SQL:

1. Open your Lovable Cloud backend
2. Run this SQL query (replace `your-email@example.com` with your actual email):

```sql
-- Find your user_id
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Add admin role (use the id from the previous query)
INSERT INTO public.user_roles (user_id, role)
VALUES ('YOUR_USER_ID_HERE', 'admin');
```

## Step 3: Access Admin Dashboard
1. Log out and log back in
2. Navigate to `/admin`
3. You should now have full access to the Admin Dashboard

## Security Notes
- **Only** trusted users should have admin access
- The `useAdmin` hook validates admin status server-side using RLS policies
- Admin status cannot be manipulated from client-side code
- All admin operations are protected by Row-Level Security

## Next Steps
Once you have admin access, you can:
- Manage carriers, tools, training modules
- Upload documents and media
- Manage user roles and permissions
- View analytics and system settings
