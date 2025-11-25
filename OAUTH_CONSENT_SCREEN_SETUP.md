# OAuth Consent Screen Setup Guide

## What is the OAuth Consent Screen?

The OAuth consent screen is what users see when your app requests access to their Google account. However, **for your use case (Maps, Geocoding, Places APIs with API keys), you typically don't need OAuth**, but Google still recommends configuring it.

## Do You Need It?

**For your current setup (API keys only):**
- ✅ **Not strictly required** - Your API keys work without it
- ✅ **Recommended** - Google suggests configuring it for best practices
- ✅ **Future-proof** - If you add OAuth features later, it's already set up

## Quick Setup (5 minutes)

### Step 1: Navigate to OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure your project is selected
3. Go to **"APIs & Services"** → **"OAuth consent screen"**

### Step 2: Choose User Type

1. You'll see two options:
   - **External** - For apps used by users outside your organization (most common)
   - **Internal** - Only for Google Workspace accounts in your organization

2. **Select "External"** (unless you're using Google Workspace)
3. Click **"Create"**

### Step 3: Fill in App Information

Fill in the required fields:

**App name:**
```
Pluming Eagle Management
```
or
```
Pluming Eagle Lodge Management System
```

**User support email:**
- Select your email address from the dropdown
- This is where users can contact you about the app

**App logo (Optional):**
- You can skip this for now
- Or upload your company logo if you have one

**App domain (Optional):**
- You can skip this for now
- Or add your website domain if you have one

**Application home page (Optional):**
- You can skip this for now
- Or add your website URL

**Authorized domains (Optional):**
- You can skip this for now
- Or add your domain (e.g., `yourdomain.com`)

**Developer contact information:**
- Enter your email address
- This is required

### Step 4: Scopes (Skip for Now)

1. You'll see a "Scopes" section
2. **Click "Save and Continue"** without adding any scopes
3. You don't need scopes for API key-based access

### Step 5: Test Users (Skip for Now)

1. You'll see a "Test users" section
2. **Click "Save and Continue"** without adding test users
3. You don't need test users for API key access

### Step 6: Summary

1. Review the information you entered
2. Click **"Back to Dashboard"**

## That's It! ✅

The alert should disappear. Your API keys will continue to work exactly as before.

## Important Notes

### For Your Use Case:
- ✅ **You're using API keys, not OAuth** - So the consent screen won't actually be shown to users
- ✅ **This is just configuration** - It doesn't change how your app works
- ✅ **No user authentication needed** - Your Maps/Geocoding/Places APIs work with just API keys

### When You Would Need OAuth:
- If you want users to sign in with Google
- If you need to access user's Google data (Calendar, Drive, etc.)
- If you're building a public app that needs user permissions

### For Your App:
- You're using **API keys** for Maps/Geocoding/Places
- These work without OAuth
- The consent screen setup is just to satisfy Google's requirements

## Troubleshooting

### "App verification required"
- **Ignore this** - Only needed if you're using OAuth with sensitive scopes
- Your API keys work without verification

### "Publishing status: Testing"
- **This is fine** - Your app is in testing mode
- API keys work regardless of publishing status

### Can't find "OAuth consent screen"
- Make sure you're in the correct project
- Check that you have "Editor" or "Owner" permissions

## Summary

1. ✅ Go to "APIs & Services" → "OAuth consent screen"
2. ✅ Select "External" user type
3. ✅ Fill in app name and your email
4. ✅ Skip optional fields
5. ✅ Skip scopes and test users
6. ✅ Save and continue

**Result**: The alert disappears, and your API keys continue working normally.

This is a one-time setup that takes about 5 minutes and makes Google happy! 😊

