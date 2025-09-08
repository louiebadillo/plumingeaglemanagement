import { makeStyles } from '@mui/styles';

export default makeStyles((theme) => ({
  container: {
    height: '100vh',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  logotypeContainer: {
    backgroundImage: 'url(/images/backgroundlogin.jpg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: '60%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '1rem',
    paddingBottom: '9rem',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      zIndex: 1,
    },
    '& > *': {
      position: 'relative',
      zIndex: 2,
    },
    [theme.breakpoints.down('md')]: {
      width: '50%',
    },
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  logotypeImage: {
    width: 165,
    marginBottom: theme.spacing(4),
  },
  logotypeText: {
    color: 'white',
    fontWeight: 500,
    fontSize: 84,
    textAlign: 'center',
    [theme.breakpoints.down('md')]: {
      fontSize: 48,
    },
  },
  logotypeSubText: {
    color: 'white',
    fontWeight: 300,
    fontSize: 32,
    textAlign: 'center',
    marginTop: theme.spacing(2),
    opacity: 0.9,
    [theme.breakpoints.down('md')]: {
      fontSize: 18,
    },
  },
  customFormContainer: {
    width: '40%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    overflow: 'auto',
    alignItems: 'center',
    [theme.breakpoints.down('md')]: {
      width: '50%',
      overflow: 'visible',
    },
  },
  formContainer: {
    width: '40%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    alignItems: 'center',
    [theme.breakpoints.down('md')]: {
      width: '50%',
      overflow: 'visible',
    },
  },
  form: {
    width: 320,
  },
  tab: {
    fontWeight: 400,
    fontSize: 18,
  },
  greeting: {
    fontWeight: 500,
    textAlign: 'center',
    marginTop: theme.spacing(4),
  },
  logoMessageContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
  },
  formLogo: {
    width: 240,
    height: 'auto',
    marginBottom: theme.spacing(15),
    marginTop: theme.spacing(10),
  },
  signInMessage: {
    fontWeight: 400,
    textAlign: 'center',
    fontSize: '1.5rem',
    color: theme.palette.text.primary,
  },
  subGreeting: {
    fontWeight: 500,
    textAlign: 'center',
    marginTop: theme.spacing(2),
  },
  errorMessage: {
    textAlign: 'center',
    color: '#ff0000ba',
  },
  textFieldUnderline: {
    '&:before': {
      borderBottomColor: theme.palette.primary.light,
    },
    '&:after': {
      borderBottomColor: theme.palette.primary.main,
    },
    '&:hover:before': {
      borderBottomColor: `${theme.palette.primary.light} !important`,
    },
  },
  textField: {
    borderBottomColor: theme.palette.background.light,
  },
  formButtons: {
    width: '100%',
    marginTop: theme.spacing(4),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgetButton: {
    textTransform: 'none',
    fontWeight: 400,
  },
  loginLoader: {
    marginLeft: theme.spacing(4),
  },
  copyright: {
    marginTop: theme.spacing(4),
    whiteSpace: 'nowrap',
    [theme.breakpoints.up('md')]: {
      bottom: theme.spacing(2),
    },
  },
}));
