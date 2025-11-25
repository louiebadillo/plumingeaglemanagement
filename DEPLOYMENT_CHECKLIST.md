# Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. **Environment Variables Setup in Vercel**

**IMPORTANT**: Never commit your `.env` file to GitHub! It's already in `.gitignore`.

Instead, add environment variables directly in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Environment Variables:

```
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
REACT_APP_BACKEND=false
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

#### Optional Environment Variables:

```
REACT_APP_COMPANY_NAME=Pluming Eagle Lodge
REACT_APP_COMPANY_TAGLINE=Empowering The Next Generation
REACT_APP_DEBUG=false
REACT_APP_LOG_LEVEL=error
```

**Note**: Make sure to add these for **Production**, **Preview**, and **Development** environments in Vercel.

### 2. **Local .env File (for development)**

Create a `.env` file in your project root (this stays local, never commit it):

```bash
# Copy the example file
cp env.example .env
```

Then edit `.env` and add your actual values:
- `REACT_APP_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
- `REACT_APP_SUPABASE_URL` - Your Supabase project URL (e.g., https://xxxxx.supabase.co)
- `REACT_APP_SUPABASE_ANON_KEY` - Your Supabase anon/public key
- `REACT_APP_SUPABASE_SERVICE_KEY` - Your Supabase service role key (for admin operations)

### 3. **Verify Build Works Locally**

```bash
# Test the production build
npm run build

# If successful, you're ready to deploy!
```

## 🚀 Deployment Steps

### Step 1: Commit Your Changes

```bash
# Check what files have changed
git status

# Add all changes (except .env - it's gitignored)
git add .

# Commit with a descriptive message
git commit -m "feat: optimize bundle size, fix compilation errors, add admin dashboard improvements"

# Push to GitHub
git push origin main
```

### Step 2: Vercel Auto-Deployment

Once you push to GitHub:
- Vercel will automatically detect the push
- It will run `npm run build` (or `yarn build` based on your vercel.json)
- The deployment will use the environment variables you set in Vercel dashboard

### Step 3: Verify Deployment

1. Check Vercel dashboard for deployment status
2. Once deployed, test the application:
   - ✅ Login works
   - ✅ Google Maps geofencing works (if API key is set)
   - ✅ Supabase connection works
   - ✅ All features function correctly

## 📋 Pre-Push Checklist

Before pushing to GitHub, verify:

- [ ] Build completes successfully (`npm run build`)
- [ ] No compilation errors
- [ ] `.env` file is NOT committed (check `git status`)
- [ ] All environment variables are added in Vercel dashboard
- [ ] Google Maps API key is configured in Vercel
- [ ] Supabase credentials are configured in Vercel
- [ ] Tested locally that the app works

## 🔐 Security Reminders

1. **Never commit `.env` files** - They contain sensitive keys
2. **Use Vercel Environment Variables** for production secrets
3. **Restrict Google Maps API key** in Google Cloud Console:
   - Set HTTP referrer restrictions
   - Limit to your Vercel domain
4. **Keep Supabase keys secure** - Never expose in client-side code (anon key is okay, service role key is NOT)

## 🐛 Troubleshooting

### Build Fails in Vercel

1. Check Vercel build logs
2. Verify all environment variables are set
3. Check if any new dependencies need to be installed
4. Verify `vercel.json` configuration

### Google Maps Not Working

1. Verify `REACT_APP_GOOGLE_MAPS_API_KEY` is set in Vercel
2. Check API key restrictions in Google Cloud Console
3. Ensure Maps JavaScript API and Geocoding API are enabled
4. Check browser console for API errors

### Supabase Connection Issues

1. Verify `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` are set
2. Check Supabase project is active
3. Verify RLS policies are configured correctly

## 📝 Quick Commands

```bash
# Check what will be committed (should NOT show .env)
git status

# See all changes
git diff

# Commit and push
git add .
git commit -m "Your commit message"
git push origin main

# Check build locally
npm run build
```

## 🎯 Next Steps After Deployment

1. Test all features in production
2. Monitor Vercel logs for any errors
3. Check Google Maps API usage in Google Cloud Console
4. Verify geofencing works correctly
5. Test admin and employee workflows

---

**Ready to deploy?** Follow the steps above and your app will be live on Vercel! 🚀

