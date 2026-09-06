import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import AppTheme from '../../shared-theme/AppTheme';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
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

const EditContainer = styled(Stack)(({ theme }) => ({
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

export default function EditAttendee(props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [apiError, setApiError] = React.useState(""); 

  // Values
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [zip, setZip] = React.useState('');
  const [afm, setAfm] = React.useState('');

  // Password Visibility
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Errors
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [passError, setPassError] = React.useState(false);
  const [passErrorMessage, setPassErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [lastNameError, setLastNameError] = React.useState(false);
  const [lastNameErrorMessage, setLastNameErrorMessage] = React.useState('');
  const [genderError, setGenderError] = React.useState(false);
  const [genderErrorMessage, setGenderErrorMessage] = React.useState('');
  const [phoneNumberError, setPhoneNumberError] = React.useState(false);
  const [phoneNumberErrorMessage, setPhoneNumberErrorMessage] = React.useState('');
  const [addressError, setAddressError] = React.useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = React.useState('');
  const [zipError, setZipError] = React.useState(false);
  const [zipErrorMessage, setZipErrorMessage] = React.useState('');

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  React.useEffect(() => {
    if (!user) return;

    const populateForm = (data) => {
      if (!data) return;
      setUsername(data.username || "");
      setFirstName(data.first_name || data.firstName || data.name || "");
      setLastName(data.last_name || data.lastName || "");
      setGender(data.gender || "");
      setPhone(data.phone || data.phoneNumber || "");
      setAfm(data.afm || "");
      setEmail(data.email || "");

      let fetchedAddress = data.address || "";
      let fetchedZip = "";
      if (fetchedAddress.includes(",")) {
        const parts = fetchedAddress.split(",");
        fetchedZip = parts.pop().trim();
        fetchedAddress = parts.join(",").trim();
      }
      setAddress(fetchedAddress);
      setZip(fetchedZip);
    };

    const loadProfileData = async () => {
      try {
        setApiError(""); 
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        const storedUser = JSON.parse(localStorage.getItem('user_data') || '{}');

        // pre fill the form with localStorage
        populateForm({ ...storedUser, ...user });

        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`http://localhost:8000/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const freshData = await response.json();
          populateForm(freshData); 
        } else {
          const errorText = await response.text();
          setApiError(`Το Backend απέρριψε το αίτημα: ${response.status} - ${errorText}`);
        }

      } catch (err) {
        setApiError(`Network Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user]);

  const validateInputs = () => {
    let isValid = true;

    if (password) {
      if (password.length < 8) {
        setPasswordError(true);
        setPasswordErrorMessage('Ο Κωδικός Πρόσβασης πρέπει να έχει μήκος τουλάχιστον 8 χαρακτήρες.');
        isValid = false;
      } else {
        setPasswordError(false);
        setPasswordErrorMessage('');
      }

      if (confirmPassword !== password) {
        setPassError(true);
        setPassErrorMessage('Η Επιβεβαίωση Κωδικού δεν ταιριάζει με τον Κωδικό Πρόσβασης.');
        isValid = false;
      } else {
        setPassError(false);
        setPassErrorMessage('');
      }
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
      setPassError(false);
      setPassErrorMessage('');
    }

    if (!firstName || firstName.length < 1) {
      setNameError(true);
      setNameErrorMessage('Το Όνομα είναι υποχρεωτικό.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!lastName || lastName.length < 1) {
      setLastNameError(true);
      setLastNameErrorMessage('Το Επώνυμο είναι υποχρεωτικό.');
      isValid = false;
    } else {
      setLastNameError(false);
      setLastNameErrorMessage('');
    }

    if (!gender) {
      setGenderError(true);
      setGenderErrorMessage('Το Φύλο είναι υποχρεωτικό.');
      isValid = false;
    } else {
      setGenderError(false);
      setGenderErrorMessage('');
    }

    if (!phone || phone.length !== 10 || !/^\d+$/.test(phone)) {
      setPhoneNumberError(true);
      setPhoneNumberErrorMessage('Το Τηλέφωνο Επικοινωνίας πρέπει να έχει μήκος 10 ψηφία.');
      isValid = false;
    } else {
      setPhoneNumberError(false);
      setPhoneNumberErrorMessage('');
    }

    if (!address || address.length < 1) {
      setAddressError(true);
      setAddressErrorMessage('Η Διεύθυνση είναι υποχρεωτική.');
      isValid = false;
    } else {
      setAddressError(false);
      setAddressErrorMessage('');
    }

    if (!zip || zip.length !== 5) {
      setZipError(true);
      setZipErrorMessage('Ο Ταχυδρομικός Κώδικας πρέπει να έχει 5 ψηφία.');
      isValid = false;
    } else {
      setZipError(false);
      setZipErrorMessage('');
    }

    return isValid;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!validateInputs()) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      const storedUser = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      const payload = {
        first_name: firstName,
        last_name: lastName,
        gender: gender,
        address: zip ? `${address}, ${zip}` : address,
        phone: phone,
      };
      
      if (password) payload.password = password;

      const response = await fetch(`http://localhost:8000/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Σφάλμα κατά την αποθήκευση.");
      }

      const updatedUser = { ...storedUser, ...payload };
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      alert("Το προφίλ χρήστη ενημερώθηκε επιτυχώς!");
      navigate("/Home");
      
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <EditContainer direction="column" justifyContent="center" alignItems="center">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Φόρτωση Προφίλ...</Typography>
        </EditContainer>
      </AppTheme>
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <EditContainer direction="column" justifyContent="flex-start">
        <Card variant="outlined">
          <Typography component="h1" variant="h4" sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}>
            Επεξεργασία <span style={{ fontSize: '0.6em', fontWeight: 'normal' }}>Προφίλ Χρήστη</span>
          </Typography>

          {apiError && (
            <Alert severity="warning" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
              {apiError}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSave}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {/* username cannot be changed */}
            <FormControl>
              <FormLabel htmlFor="username">Όνομα Χρήστη</FormLabel>
              <TextField
                fullWidth
                id="username"
                value={username}
                disabled
                variant="outlined"
                sx={{ bgcolor: '#f9f9f9' }}
              />
            </FormControl>

             {/* password (optional) */}
            <FormControl>
              <FormLabel htmlFor="password">Νέος Κωδικός Πρόσβασης (Προαιρετικό)</FormLabel>
              <TextField
                fullWidth
                id="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

             {/* confirm password (optional) */}
            <FormControl>
              <FormLabel htmlFor="confirmPassword">Επιβεβαίωση Νέου Κωδικού Πρόσβασης</FormLabel>
              <TextField
                fullWidth
                id="confirmPassword"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type={showConfirmPassword ? "text" : "password"}
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

            {/* name, last name, gender */}
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth sx={{ flex: 2 }}>
                <FormLabel htmlFor="firstName">Όνομα</FormLabel>
                <TextField
                  fullWidth
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Όνομα"
                  error={nameError}
                  helperText={nameErrorMessage}
                  color={nameError ? 'error' : 'primary'}
                />
              </FormControl>
              <FormControl fullWidth sx={{ flex: 2 }}>
                <FormLabel htmlFor="lastName">Επώνυμο</FormLabel>
                <TextField
                  fullWidth
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Επώνυμο"
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
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  variant="outlined"
                  error={genderError}
                  renderValue={(selected) => {
                    if (!selected || selected.length === 0) return <Typography sx={{ color: 'text.secondary', opacity: 0.7 }}>Επιλέξτε</Typography>;
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

             {/* email cannot be changed */}
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                fullWidth
                id="email"
                value={email}
                disabled
                variant="outlined"
                sx={{ bgcolor: '#f9f9f9' }}
              />
            </FormControl>

            {/* phone number */}
            <FormControl>
              <FormLabel htmlFor="phone">Τηλέφωνο Επικοινωνίας</FormLabel>
              <TextField
                fullWidth
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Σταθερό ή Κινητό Τηλέφωνο"
                variant="outlined"
                error={phoneNumberError}
                helperText={phoneNumberErrorMessage}
                color={phoneNumberError ? 'error' : 'primary'}
              />
            </FormControl>

            {/* address and zip code */}
            <Stack direction="row" spacing={2}>
              <FormControl fullWidth sx={{ flex: 1 }} error={addressError}>
                <FormLabel htmlFor="address">Διεύθυνση</FormLabel>
                <TextField
                  fullWidth
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Οδός, Αριθμός, Πόλη"
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
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="xxxxx"
                  variant="outlined"
                  error={zipError}
                  helperText={zipErrorMessage}
                  color={zipError ? 'error' : 'primary'}
                />
              </FormControl>
            </Stack>

            {/* afm cannot be changed */}
            <FormControl>
              <FormLabel htmlFor="afm">ΑΦΜ</FormLabel>
              <TextField
                fullWidth
                id="afm"
                value={afm}
                disabled
                variant="outlined"
                sx={{ bgcolor: '#f9f9f9' }}
              />
            </FormControl>

            {/* save and cancel buttons */}
            <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button type="submit" fullWidth variant="contained" size="large"
              sx={{ 
                  background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
                  fontWeight: 'bold', 
                  color: 'white',
                  border: '1px solid #2e7d32',
                  boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                }}>
                Αποθήκευση Αλλαγών
              </Button>
              <Button type="button" fullWidth variant="outlined" size="large"
              sx={{ 
                background: 'linear-gradient(to bottom, #8a8c8aff, #525151ff) !important',
                fontWeight: 'bold', 
                color: 'white',
                border: '1px solid #3e3e3eff',
                boxShadow: '0 3px 5px 2px rgba(47, 52, 47, 0.3)',
              }}
                onClick={() => navigate("/Home")}>
                Ακύρωση
              </Button>
            </Box>
          </Box>
        </Card>
      </EditContainer>
    </AppTheme>
  );
}