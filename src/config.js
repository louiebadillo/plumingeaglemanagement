// Supabase configuration
const supabaseUrl = 'https://brkbypctkcczerntfpsa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJya2J5cGN0a2NjemVybnRmcHNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTk0ODEsImV4cCI6MjA3Mzc5NTQ4MX0.SPaPOjLKgOb68CrkaFp4B7LBAZX2eW-unoxSe0OeklE';

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
