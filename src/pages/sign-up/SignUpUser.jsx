import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../../shared-theme/AppTheme';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
// import OutlinedInput from '@mui/material/OutlinedInput';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '700px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));


const SignUpContainer = styled(Stack)(({ theme }) => ({
  minHeight: '100dvh', 
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  overflowY: 'auto', 
  position: 'relative',
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage: 'none', 
    backgroundColor: theme.palette.background.default,
  },
}));

export default function SignUpUser(props) {
  const { login, logout } = useAuth();
  const [openDialog, setOpenDialog] = React.useState(false);
  const navigate = useNavigate();
  const [usernameError, setUsernameError] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [passError, setPassError] = React.useState(false);
  const [passErrorMessage, setPassErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [lastNameError, setLastNameError] = React.useState(false);
  const [lastNameErrorMessage, setLastNameErrorMessage] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [genderError, setGenderError] = React.useState(false);
  const [genderErrorMessage, setGenderErrorMessage] = React.useState('');
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [phoneNumberError, setPhoneNumberError] = React.useState(false);
  const [phoneNumberErrorMessage, setPhoneNumberErrorMessage] = React.useState('');
  const [addressError, setAddressError] = React.useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = React.useState('');
  const [zipError, setZipError] = React.useState(false);
  const [zipErrorMessage, setZipErrorMessage] = React.useState('');
  const [afmError, setAfmError] = React.useState(false);
  const [afmErrorMessage, setAfmErrorMessage] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    navigate('/home');
  };

  // Log out any existing user when visiting signup page
  React.useEffect(() => {
    logout();
  }, []);

  const validateInputs = () => {
    const username = document.getElementById('username');
    const name = document.getElementById('name');
    const lastName = document.getElementById('lastName');
    const address = document.getElementById('address');
    const zip = document.getElementById('zip');
    const phoneNumber = document.getElementById('phoneNumber');
    const afm = document.getElementById('afm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const pass = document.getElementById('pass');

    let isValid = true;

    // ERROR MESSAGES FOR ALL FIELDS WHEN EMPTY
    if (!username.value || username.value.length < 1){
      setUsernameError(true);
      setUsernameErrorMessage('Το Όνομα Χρήστη είναι υποχρεωτικό.');
      isValid = false;
    } else {
      setUsernameError(false);
      setUsernameErrorMessage('');
    }

    if (!password.value || password.value.length < 8) {
      setPasswordError(true);
      setPasswordErrorMessage('Ο Κωδικός Πρόσβασης πρέπει να έχει μήκος τουλάχιστον 8 χαρακτήρες.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!pass.value || pass.value.length !== password.value.length || pass.value !== password.value) {
      setPassError(true);
      setPassErrorMessage('Η Επιβεβαίωση Κωδικού δεν ταιριάζει με τον Κωδικό Πρόσβασης.');
      isValid = false;
    } else {
      setPassError(false);
      setPassErrorMessage('');
    }

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('Το Όνομα είναι υποχρεωτικό.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!lastName.value || lastName.value.length < 1) {
      setLastNameError(true);
      setLastNameErrorMessage('Το Επώνυμο είναι υποχρεωτικό.');
      isValid = false;
    } else {
      setLastNameError(false);
      setLastNameErrorMessage('');
    }

    if (!gender || gender.length === 0) {
      setGenderError(true);
      setGenderErrorMessage('Το Φύλο είναι υποχρεωτικό.');
      isValid = false;
    } else {
      setGenderError(false);
      setGenderErrorMessage('');
    }

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Μη έγκυρο email.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!phoneNumber || phoneNumber.value.length !== 10 || !/^\d+$/.test(phoneNumber.value)) {
      setPhoneNumberError(true);
      setPhoneNumberErrorMessage('Το Τηλέφωνο Επικοινωνίας πρέπει να έχει μήκος 10 χαρακτήρες.');
      isValid = false;
    } else {
      setPhoneNumberError(false);
      setPhoneNumberErrorMessage('');
    }

    if (!address.value || address.value.length < 1) {
      setAddressError(true);
      setAddressErrorMessage('Η Διεύθυνση είναι υποχρεωτική.');
      isValid = false;
    } else {
      setAddressError(false);
      setAddressErrorMessage('');
    }

    if (!zip.value || zip.value.length !== 5) {
      setZipError(true);
      setZipErrorMessage('Ο Ταχυδρομικός Κώδικας πρέπει να έχει μήκος 5 χαρακτήρες.');
      isValid = false;
    } else {
      setZipError(false);
      setZipErrorMessage('');
    }

    if (!afm.value || afm.value.length !== 9) {
      setAfmError(true);
      setAfmErrorMessage('Ο ΑΦΜ πρέπει να έχει μήκος 9 χαρακτήρες.');
      isValid = false;
    } else {
      setAfmError(false);
      setAfmErrorMessage('');
    }

    return isValid;
  };



const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    const data = new FormData(event.currentTarget);

    // Map your frontend form data to exactly match the backend Pydantic schema (UserCreate)
    const newUser = {
      username: data.get('username'),
      password: data.get('password'),
      confirm_password: data.get('pass'),
      first_name: data.get('name'),         // Mapped from 'name'
      last_name: data.get('lastName'),      // Mapped from 'lastName'
      email: data.get('email'),
      phone: data.get('phoneNumber'),       // Mapped from 'phoneNumber'
      // Combine address and zip into a single address string since backend schema has one address field
      address: `${data.get('address')}, ${data.get('zip')}`, 
      city: "",
      country: "",
      afm: data.get('afm'),
      // Geolocation is optional in backend, so we leave it null for now
      latitude: null,
      longitude: null ,
      role: "ATTENDEE"
    };

    try {
      // Send POST request to FastAPI. Notice the ?role=ORGANIZER query parameter!
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        // Registration successful! 
        // DO NOT log the user in. The assignment strictly requires them to pend admin approval.
        setOpenDialog(true);        
        // Redirect them back to the login page (or a dedicated 'Pending' page if you built one)
      } else {
        // Handle validation errors from FastAPI (e.g., username already exists)
        const errorData = await response.json();
        // 4. FastAPI 422 errors put details in an array. This prints exactly what field is failing.
        const errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        alert(`Αποτυχία εγγραφής: ${errorMessage}`);
        // alert(errorData.detail || "Υπήρξε πρόβλημα κατά την εγγραφή.");
      }
    } catch (error) {
      console.error("Connection Error:", error);
      alert("Δεν ήταν δυνατή η σύνδεση με τον διακομιστή (FastAPI).");
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <SignUpContainer direction="column" justifyContent="flex-start">

        <Card variant="outlined">
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Εγγραφή <span style={{ fontSize: '0.6em', fontWeight: 'normal' }}>για Χρήστες</span>
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="username">Όνομα Χρήστη</FormLabel>
              <TextField
                fullWidth
                id="username"
                placeholder="Όνομα Χρήστη"
                name="username"
                autoComplete="username"
                variant="outlined"
                error={usernameError}
                helperText={usernameErrorMessage}
                color={usernameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Κωδικός Πρόσβασης</FormLabel>
              <TextField
                fullWidth
                name="password"
                placeholder="••••••"
                id="password"
                autoComplete="new-password"
                variant="outlined"
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

            <FormControl>
              <FormLabel htmlFor="pass">Επιβεβαίωση Κωδικού Πρόσβασης</FormLabel>
              <TextField
                fullWidth
                id="pass"
                placeholder="••••••"
                name="pass"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="pass"
                variant="outlined"
                slotProps={{ input:{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={handleClickShowConfirmPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),}
                }}
                error={passError}
                helperText={passErrorMessage}
                color={passError ? 'error' : 'primary'}
              />
            </FormControl>
            <Stack direction="row" spacing={2}>
            <FormControl fullWidth sx={{ flex: 2 }}>
              <FormLabel htmlFor="name">Όνομα</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                fullWidth
                id="name"
                placeholder="Όνομα"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl fullWidth sx={{ flex: 2 }}>
              <FormLabel htmlFor="email">Επώνυμο</FormLabel>
              <TextField
                fullWidth
                id="lastName"
                placeholder="Επώνυμο"
                name="lastName"
                autoComplete="lastName"
                variant="outlined"
                error={lastNameError}
                helperText={lastNameErrorMessage}
                color={lastNameError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl fullWidth sx={{ flex: 1 }} error={genderError}>
              <FormLabel htmlFor="gender">Φύλο</FormLabel>
              <Select
                displayEmpty
                fullWidth
                id="gender"
                name="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                variant="outlined"
                error={genderError}
                renderValue={(selected) => {
                  if (!selected || selected.length === 0) {
                    return <Typography sx={{ color: 'text.secondary', opacity: 0.7 }}>Επιλέξτε Φύλο</Typography>;
                  }
                  if (selected === 'male') return 'Άνδρας';
                  if (selected === 'female') return 'Γυναίκα';
                  return 'Άλλο';
                }}
              >
              <MenuItem value="" disabled></MenuItem>
              <MenuItem value="male">Άνδρας</MenuItem>
              <MenuItem value="female">Γυναίκα</MenuItem>
              <MenuItem value="other">Άλλο</MenuItem>
              </Select>
              {genderError && <FormHelperText>{genderErrorMessage}</FormHelperText>}
            </FormControl>
            </Stack>

            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                variant="outlined"
                error={emailError}
                helperText={emailErrorMessage}
                color={emailError ? 'error' : 'primary'}
              />
            </FormControl>

            <FormControl>
              <FormLabel htmlFor="email">Τηλέφωνο Επικοινωνίας</FormLabel>
              <TextField
                fullWidth
                id="phoneNumber"
                placeholder="Σταθερό ή Κινητό Τηλέφωνο"
                name="phoneNumber"
                autoComplete="phoneNumber"
                variant="outlined"
                error={phoneNumberError}
                helperText={phoneNumberErrorMessage}
                color={phoneNumberError ? 'error' : 'primary'}
              />
            </FormControl>

            <Stack direction="row" spacing={2}>
            <FormControl fullWidth sx={{ flex: 1 }} error={addressError}>
              <FormLabel htmlFor="address">Διεύθυνση</FormLabel>
              <TextField
                fullWidth
                id="address"
                placeholder="Οδός, Αριθμός, Πόλη"
                name="address"
                autoComplete="address"
                variant="outlined"
                error={addressError}
                helperText={addressErrorMessage}
                color={addressError ? 'error' : 'primary'}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="zip">Ταχυδρομικός Κώδικας</FormLabel>
              <TextField
                fullWidth
                id="zip"
                placeholder="xxxxx"
                name="zip"
                autoComplete="zip"
                variant="outlined"
                error={zipError}
                helperText={zipErrorMessage}
                color={zipError ? 'error' : 'primary'}
              />
            </FormControl>
            </Stack>

            <FormControl>
              <FormLabel htmlFor="afm">ΑΦΜ</FormLabel>
              <TextField
                fullWidth
                id="afm"
                placeholder="xxxxxxxxx"
                name="afm"
                autoComplete="afm"
                variant="outlined"
                error={afmError}
                helperText={afmErrorMessage}
                color={afmError ? 'error' : 'primary'}
              />
            </FormControl>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 4 }}
          >
            Εγγραφή
          </Button>

          </Box>
          <Divider></Divider>
            <Typography sx={{ textAlign: 'center' }}>
              Έχεις ήδη λογαριασμό;{' '}
              <Link
                href="/login"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Συνδέσου
              </Link>
            </Typography>
        </Card>
      </SignUpContainer>
      {/* Pop-up Παράθυρο Αναμονής Έγκρισης */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Η Εγγραφή ήταν Επιτυχής!"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Η αίτηση εγγραφής σας ολοκληρώθηκε με επιτυχία. Εκκρεμεί η έγκριση της αίτησης εγγραφής στην εφαρμογή από τον διαχειριστή. Μόλις εγκριθεί, θα μπορείτε να συνδεθείτε με τα στοιχεία σας.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} autoFocus variant="contained">
            Επιστροφή στην Αρχική Σελίδα
          </Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
}