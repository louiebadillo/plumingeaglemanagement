import React, { useState, useEffect } from 'react';
import {
  Grid,
  CircularProgress,
  Grow,
  TextField as Input,
  Typography,
} from '@mui/material';
import { withRouter } from 'react-router-dom';

// styles
import useStyles from './styles';

// logo - using public path
const logo = '/pellogofinal.png';

// context
import { useSupabase } from '../../context/SupabaseContext';

//components
import { Button } from '../../components/Wrappers';
import { getConfig } from '../../config/template';


function Login(props) {
  let classes = useStyles();
  // const tab = new URLSearchParams(props.location.search).get('tab');

  // global
  const { signIn, supabase } = useSupabase();

  useEffect(() => {
    // Handle any URL parameters if needed
    const params = new URLSearchParams(props.location.search);
    const token = params.get('token');
    if (token) {
      // Handle token-based login if needed
      console.log('Token found:', token);
    }
  }, []); // eslint-disable-line

  // local
  let [isLoading, setIsLoading] = useState(false);
  let [error, setError] = useState(null);
  let [loginValue, setLoginValue] = useState('');
  let [passwordValue, setPasswordValue] = useState('');
  let [isForgot, setIsForgot] = useState(false);

  let isLoginFormValid = () => {
    return loginValue.length !== 0 && passwordValue.length !== 0;
  };

  let loginOnEnterKey = async (event) => {
    if (event.key === 'Enter' && isLoginFormValid()) {
      await handleLogin();
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await signIn(loginValue, passwordValue);
      
      if (error) {
        setError(error.message);
      } else {
        // Login successful, redirect to dashboard
        props.history.push('/app/dashboard');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid container className={classes.container}>
      <div className={classes.logotypeContainer}>
        <Typography className={classes.logotypeText}>
          {getConfig('COMPANY.NAME') || 'Pluming Eagle Lodge'}
        </Typography>
        <Typography className={classes.logotypeSubText}>
          {getConfig('COMPANY.TAGLINE') || 'Empowering The Next Generation'}
        </Typography>
      </div>
      <div
        className={
          !isForgot ? classes.formContainer : classes.customFormContainer
        }
      >
        <div className={classes.form}>
          {isForgot ? (
            <div>
              <div className={classes.logoMessageContainer}>
                <img src={logo} alt='logo' className={classes.formLogo} />
                <Typography variant='h4' className={classes.signInMessage}>
                  Forgot Password
                </Typography>
              </div>
              <Typography
                variant='body1'
                style={{
                  textAlign: 'center',
                  marginTop: 32,
                  marginBottom: 32,
                  padding: '16px',
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  borderRadius: 4,
                  color: 'rgba(0, 0, 0, 0.87)'
                }}
              >
                Please notify an admin or supervisor to change your password. Thank you.
              </Typography>
              <div className={classes.formButtons}>
                <Button
                  color='primary'
                  size='large'
                  onClick={() => setIsForgot(!isForgot)}
                  variant='contained'
                  fullWidth
                >
                  Back to login
                </Button>
              </div>
            </div>
          ) : (
            <>
              <React.Fragment>
                  {/* Logo and Sign-in Message Section */}
                  <div className={classes.logoMessageContainer}>
                    <img src={logo} alt='logo' className={classes.formLogo} />
                    <Typography variant='h4' className={classes.signInMessage}>
                      Sign in to your account
                    </Typography>
                  </div>
                  <Grow
                    in={error}
                    style={
                      !error ? { display: 'none' } : { display: 'inline-block' }
                    }
                  >
                    <Typography className={classes.errorMessage}>
                      Something is wrong with your login or password :(
                    </Typography>
                  </Grow>
                  <Input
                    id='email'
                    InputProps={{
                      classes: {
                        underline: classes.InputUnderline,
                        input: classes.Input,
                      },
                    }}
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    margin='normal'
                    placeholder='Email Address'
                    type='email'
                    fullWidth
                    disabled={isLoading}
                    onKeyDown={(e) => loginOnEnterKey(e)}
                  />
                  <Input
                    id='password'
                    InputProps={{
                      classes: {
                        underline: classes.InputUnderline,
                        input: classes.Input,
                      },
                    }}
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    margin='normal'
                    placeholder='Password'
                    type='password'
                    fullWidth
                    disabled={isLoading}
                    onKeyDown={(e) => loginOnEnterKey(e)}
                  />
                  <div className={classes.formButtons}>
                    {isLoading ? (
                      <Button
                        disabled
                        variant='contained'
                        color='primary'
                        size='large'
                        fullWidth
                        startIcon={<CircularProgress size={20} color="inherit" />}
                      >
                        Logging in...
                      </Button>
                    ) : (
                      <Button
                        disabled={!isLoginFormValid()}
                        onClick={handleLogin}
                        variant='contained'
                        color='primary'
                        size='large'
                        fullWidth
                      >
                        Login
                      </Button>
                    )}
                    <Button
                      color='primary'
                      size='large'
                      onClick={() => setIsForgot(!isForgot)}
                      className={classes.forgetButton}
                      disabled={isLoading}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                </React.Fragment>
            </>
          )}
        </div>
        <Typography color='primary' className={classes.copyright}>
          {getConfig('COMPANY.COPYRIGHT') || `© ${new Date().getFullYear()} Pluming Eagle Lodge. All rights reserved.`}
        </Typography>
      </div>
    </Grid>
  );
}

export default withRouter(Login);
