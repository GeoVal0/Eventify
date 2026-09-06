import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import AppTheme from '../shared-theme/AppTheme';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props) {
  //store user input values, error statesm and messages 
  const [username, setUsername] = React.useState('');
  const [usernameError, setUsernameError] = React.useState('');
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  //if a user is already logged in, log them out when they visit the login page for safety
  React.useEffect(() => {
    if (user) {
      logout();
    }
    setReady(true);
  }, []);


  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => {event.preventDefault();};
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, logout } = useAuth();

  React.useEffect(() => {
    if (user) {
      const userRole = JSON.parse(localStorage.getItem('user_data'))?.role;
      
      if (userRole === "ADMIN") {
        navigate('/admin/UserList', { replace: true });
      } else {
        const returnPath = location.state?.from || '/Home';
        const returnState = location.state?.event ? { event: location.state.event } : {};
        navigate(returnPath, { state: returnState, replace: true });
      }
    } else {
      setReady(true);
    }
  }, [user, navigate, location]);

  //local validation
  const validateInputs = () => {
    let isValid = true;

    if (!username || username.trim() === 0){
      setUsernameError('true');
      setUsernameErrorMessage('Το Όνομα Χρήστη είναι υποχρεωτικό,');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!password || password.length < 8) {
      setPasswordError(true);
      setPasswordErrorMessage('Ο Κωδικός πρέπει να έχει μήκος τουλάχιστον 8 χαρακτήρες.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    //if inputs are not valid, do not proceed with the API call
    if (!validateInputs())
      return;

    //API call to AuthContext
    const result = await login(username, password);

    //if login is successful, navigate to the appropriate page based on user role. otherwise, show an error message
    if (!result.success) {
      setFormError('Λάθος όνομα χρήστη ή κωδικός πρόσβασης.');
    }
  };


  if (!ready) return null;
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)', color:'text.primary' }}
          >
            Σύνδεση
          </Typography>
          
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}
          >
            {formError && <Alert severity="error">{formError}</Alert>}

            <FormControl>
              <FormLabel htmlFor="username">Username</FormLabel>
              <TextField
                id="username"
                type="text"
                name="username"
                placeholder="username"
                autoComplete="username"
                autoFocus
                fullWidth
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={usernameError}
                helperText={usernameErrorMessage}
                color={usernameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Κωδικός Πρόσβασης</FormLabel>
              <TextField
                name="password"
                placeholder="••••••"
                id="password"
                autoComplete="current-password"
                fullWidth
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                slotProps={{input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}}
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
            >
              Σύνδεση
            </Button>
            
          </Box>
          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center', mt: 3 }}>
            <Typography sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              Δεν έχετε λογαριασμό;
            </Typography>

            <Link
              href="/sign-up/SignUpAttendee"
              variant="body2"
              sx={{ textAlign: 'center', display: 'block',  color: "#000000ff" }}
            >
              Εγγραφείτε ως Χρήστης
            </Link>

            <Link
              href="/sign-up/SignUpOrganizer"
              variant="body2"
              sx={{ textAlign: 'center', display: 'block', color: "#000000ff" }}
            >
              Εγγραφείτε ως Διοργανωτής
            </Link>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}