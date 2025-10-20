// Supabase configuration - using environment variables for security
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const redirectUrl = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://your-vercel-app.vercel.app";

export default {
  supabaseUrl,
  supabaseAnonKey,
  redirectUrl,
  remote: "https://sing-generator-node.herokuapp.com",
  isBackend: true, // Use Supabase backend
  auth: {
    email: 'admin@plumingeagle.com',
    password: 'admin123',
  },
  app: {
    colors: {
      dark: '#002B49',
      light: '#FFFFFF',
      sea: '#004472',
      sky: '#E9EBEF',
      wave: '#D1E7F6',
      rain: '#CCDDE9',
      middle: '#D7DFE6',
      black: '#13191D',
      salat: '#21AE8C',
    },
  },
};
