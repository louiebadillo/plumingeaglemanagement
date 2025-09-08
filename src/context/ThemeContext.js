import React from 'react';
import { createTheme } from '@mui/material/styles';
import Themes from '../themes';

// Fallback theme in case Themes.default is not available
const fallbackTheme = createTheme({
  palette: {
    primary: {
      main: '#536DFE',
      light: '#8A9BFF',
      dark: '#3A4FDB',
    },
    secondary: {
      main: '#FF5C93',
      light: '#FF8FB3',
      dark: '#E91E63',
    },
  },
});

const ThemeStateContext = React.createContext();
const ThemeDispatchContext = React.createContext();

function ThemeProvider({ children }) {
  let [theme, setTheme] = React.useState(() => {
    try {
      // Ensure theme is always set in localStorage
      if (!localStorage.getItem('theme')) {
        localStorage.setItem('theme', 'default');
      }
      
      // Always start with fallback theme to ensure Material-UI has valid theme
      let selectedTheme = fallbackTheme;
      
      try {
        const savedTheme = localStorage.getItem('theme');
        const themeFromThemes = Themes[savedTheme] || Themes.default;
        
        // Validate that the theme has the required structure
        if (themeFromThemes && themeFromThemes.palette && themeFromThemes.palette.primary) {
          selectedTheme = themeFromThemes;
        } else {
          console.warn('Invalid theme structure, using fallback theme');
        }
      } catch (themeError) {
        console.warn('Error loading theme from Themes, using fallback:', themeError);
      }
      
      return selectedTheme;
    } catch (error) {
      console.error('Error in theme initialization:', error);
      return fallbackTheme;
    }
  });
  
  return (
    <ThemeStateContext.Provider value={theme}>
      <ThemeDispatchContext.Provider value={setTheme}>
        {children}
      </ThemeDispatchContext.Provider>
    </ThemeStateContext.Provider>
  );
}

function useThemeState() {
  let context = React.useContext(ThemeStateContext);
  if (context === undefined) {
    throw new Error('useThemeState must be used within a ThemeProvider');
  }
  return context;
}

function useThemeDispatch() {
  let context = React.useContext(ThemeDispatchContext);
  if (context === undefined) {
    throw new Error('useThemeDispatch must be used within a ThemeProvider');
  }
  return context;
}

export { ThemeProvider, useThemeState, useThemeDispatch, ThemeStateContext };
