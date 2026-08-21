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
import { useNavigate } from "react-router-dom";
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
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      logout();
    }
    setReady(true);
  }, []);


  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => {event.preventDefault();};
  const navigate = useNavigate();
  const { user, login, logout } = useAuth();


  const validateInputs = () => {
    let isValid = true;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError(true);
      setEmailErrorMessage('Μη έγκυρη διεύθυνση email.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password || password.length < 8) {
      setPasswordError(true);
      setPasswordErrorMessage('Ο κωδικός πρέπει να έχει μήκος τουλάχιστον 8 χαρακτήρες.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(''); // Clear previous errors

    // 1. Run Validation locally first
    if (!validateInputs()) {
      return; 
    }

    try {
      // 2. Prepare data for FastAPI's OAuth2 format
      // Note: FastAPI's default OAuth2 expects the field to be named 'username', 
      // even if the user is typing their email address into the form.
      const formData = new URLSearchParams();
      formData.append("username", email); 
      formData.append("password", password);

      // 3. Send POST request to your new Python Backend
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      // 4. Handle Server Errors (e.g., Wrong password, Admin pending)
      if (!response.ok) {
        const errorData = await response.json();
        // Extract the specific error message FastAPI sent back (like "Account pending admin approval.")
        throw new Error(errorData.detail || "Αποτυχία σύνδεσης."); 
      }

      // 5. Success! Get the JWT Token
      const data = await response.json();
      const token = data.access_token;

      // 6. Save the Token to localStorage
      // This is STRICTLY REQUIRED by your assignment to consume APIs later
      localStorage.setItem("jwt_token", token);

      // 7. Decode the JWT to find the user's role and ID
      // We don't need a heavy library for this, we can just parse the base64 payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedToken = JSON.parse(jsonPayload);
      
      // Update your AuthContext
      login({ id: decodedToken.sub, role: decodedToken.role });

      // 8. Redirect based on the role defined in your database
      switch(decodedToken.role) {
        case "ADMIN":
          navigate('/admin/dashboard');
          break;
        case "ORGANIZER":
          navigate('/organizer/dashboard');
          break;
        case "ATTENDEE":
        case "GUEST":
        default:
          navigate('/'); // Main homepage for normal users
          break;
      }

    } catch (err) {
      console.error("Login Error:", err);
      // Display the error from the backend to the user
      setFormError(err.message || 'Αδυναμία σύνδεσης στον διακομιστή.');
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
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                fullWidth
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={emailError}
                helperText={emailErrorMessage}
                color={emailError ? 'error' : 'primary'}
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
              href="/sign-up/SignUpUser"
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