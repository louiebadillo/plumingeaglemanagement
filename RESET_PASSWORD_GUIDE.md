# How to Reset User Password in Supabase

## Method 1: Via Supabase Dashboard (Easiest)

### Steps:

1. **Log in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Log in with your Supabase account

2. **Navigate to Your Project**
   - Select your project: `brkbypctkcczerntfpsa` (or your project name)

3. **Go to Authentication**
   - In the left sidebar, click on **"Authentication"**
   - Then click on **"Users"** (or it might be under "Users" tab)

4. **Find the User**
   - Use the search bar to find the user by email address
   - Click on the user's email to open their details

5. **Reset Password**
   - In the user details panel, look for **"Reset Password"** or **"Send Password Reset Email"** button
   - Click it to send a password reset email to the user
   - OR
   - Look for **"Update User"** or **"Edit"** button
   - You can manually set a new password in the password field
   - Click **"Save"** or **"Update"**

### Alternative: Direct Password Update

1. In the user details page, you might see a **"Password"** field
2. Click **"Update"** or **"Edit"** 
3. Enter a new password (must be at least 6 characters)
4. Click **"Save"**

## Method 2: Via Supabase SQL Editor (Advanced)

If you have access to the SQL Editor:

```sql
-- Update user password directly (requires service role key)
-- This is done via the Supabase Admin API, not SQL
```

## Method 3: Via Code (For Admins)

If you want to add a "Reset Password" feature in your app for admins:

```javascript
// In your admin panel, you can use Supabase Admin API
import { supabaseAdmin } from '../lib/supabaseAdmin';

const resetUserPassword = async (userId, newPassword) => {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );
  
  if (error) {
    console.error('Error resetting password:', error);
    return { success: false, error };
  }
  
  return { success: true, data };
};
```

## Quick Steps Summary:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. **Search for user** by email
3. **Click on user** to open details
4. **Click "Reset Password"** or **"Update"** button
5. **Enter new password** (min 6 characters)
6. **Save changes**

## Important Notes:

- **Password Requirements**: Minimum 6 characters
- **Email Reset**: If you use "Send Password Reset Email", the user will receive an email with a reset link
- **Direct Update**: If you manually set a password, the user can log in immediately
- **Case Sensitivity**: Email addresses are case-sensitive in Supabase Auth

## Troubleshooting:

- **Can't find the user?**: Make sure you're searching with the exact email (case-sensitive)
- **Password not working?**: Ensure it's at least 6 characters and doesn't contain special characters that might cause issues
- **User still can't log in?**: Check if the user's email is confirmed (`email_confirm: true`)

