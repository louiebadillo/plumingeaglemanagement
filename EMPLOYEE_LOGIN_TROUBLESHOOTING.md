# Employee Login Troubleshooting Guide

## Issue: "Invalid login credentials" when logging in as employee

### Possible Causes:

1. **Employee doesn't exist in Supabase Auth**
   - Check if the employee was created successfully in Staff Management
   - Verify the email address is correct

2. **Password mismatch**
   - The password used during creation might be different from what's being entered
   - Check if password was set during employee creation

3. **Email case sensitivity**
   - Supabase Auth is case-sensitive for emails
   - Make sure the email matches exactly (including case)

4. **Account not confirmed**
   - Even though `email_confirm: true` is set, there might be an issue
   - Check Supabase Auth dashboard for user status

### Steps to Fix:

1. **Verify Employee Exists:**
   - Go to Staff Management page
   - Check if the employee appears in the list
   - Verify their email address

2. **Check Password:**
   - When creating an employee, a password must be provided
   - If no password was set, the default is `defaultpassword123`
   - Try logging in with that password

3. **Reset Password (if needed):**
   - In Supabase Dashboard → Authentication → Users
   - Find the employee user
   - Click "Reset Password" or manually set a new password

4. **Create New Employee:**
   - If the employee doesn't exist, create them again in Staff Management
   - Make sure to set a password during creation
   - Note the exact email and password used

### Quick Test:

Try logging in with:
- Email: The exact email used when creating the employee
- Password: The password set during creation (or `defaultpassword123` if none was set)

### Admin vs Employee Difference:

- Admin account was likely created manually or has a known password
- Employee accounts are created through the Staff Management page
- Both should work the same way, but employee passwords must be set during creation

