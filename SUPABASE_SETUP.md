# Supabase Setup Guide

This guide explains how to set up Supabase for the Milk Shop App.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be set up (usually takes 2-3 minutes)

## 2. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `database/schema.sql`
3. Run the SQL script to create all tables, policies, and indexes

## 3. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. In your Supabase project dashboard, go to Settings > API
3. Copy your project URL and anon public key
4. Update `.env` with your actual values:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 4. Authentication Setup

The app uses Supabase Auth with the following features:
- Email/password authentication
- User registration
- Secure session management
- Automatic logout on session expiry

## 5. Database Structure

### Tables:
- **shops**: Store shop information per user
- **products**: Product catalog with inventory tracking
- **customers**: Customer database with contact info
- **bills**: Invoice/billing records
- **bill_items**: Line items for each bill

### Row Level Security (RLS):
- All tables have RLS enabled
- Users can only access their own data
- Policies enforce data isolation between users

## 6. Data Migration

The app automatically migrates data from localStorage to Supabase:
- Runs once per user on first login
- Preserves all existing data
- Initializes new users with default products

## 7. Features

### Multi-User Support:
- Each user has isolated data
- Secure authentication required
- No data leakage between users

### Cloud Storage:
- All data stored in Supabase
- Real-time synchronization
- Automatic backups

### Performance:
- Optimized database queries
- Proper indexing
- Efficient data loading

## 8. Development

To run the app locally:

```bash
npm install
npm run dev
```

Make sure your `.env` file is configured with valid Supabase credentials.

## 9. Deployment

For production deployment:

1. Set up environment variables in your hosting platform
2. Ensure Supabase project is in production mode
3. Configure proper CORS settings in Supabase

## 10. Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check your `.env` file exists and has correct values
   - Ensure variables start with `VITE_`

2. **Authentication errors**
   - Verify your Supabase project is active
   - Check anon key is correct

3. **Database permission errors**
   - Ensure RLS policies are properly set up
   - Check schema.sql was executed completely

4. **Data not loading**
   - Check browser console for errors
   - Verify network connectivity to Supabase

### Debug Mode:

Enable debug logging by opening browser console and running:
```javascript
localStorage.setItem('supabase.auth.debug', 'true')
```

## 11. Security Considerations

- Never commit `.env` files to version control
- Use different Supabase projects for development/production
- Regularly rotate API keys
- Monitor usage in Supabase dashboard
- Review RLS policies periodically

## 12. Support

For issues:
- Check Supabase documentation: https://supabase.com/docs
- Review error logs in Supabase dashboard
- Check browser console for client-side errors