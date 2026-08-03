import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Avatar, Grid
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 

export default function UserDetails(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); 

  // Fallback data in case you visit the page directly without clicking a link
  const fallbackUser = {
    id: 999,
    username: "USERNAME",
    name: "Γιώργος",
    lastName: "Παπαδόπουλος",
    sex: "Άνδρας",
    email: "fj@gmail.com",
    phoneNumber: "6999999999",
    address: "Αριστοτέλους 15, Αθήνα",
    zip: "12345",
    afm: "123456789",
    status: "pending" // Added status so the buttons show up!
  };
  
  const initialUser = location.state?.vet || fallbackUser; 
  const [userData, setUserData] = useState(initialUser);

  useEffect(() => {
    if (!initialUser) navigate('/admin/UserDetails'); 
  }, [initialUser, navigate]);

  // --- Admin Action Handlers ---
  const handleAccept = async (userId) => {
    console.log("Accepting user ID:", userId);
    // Here we will eventually add the fetch() call to the FastAPI backend
    alert("Η εγγραφή εγκρίθηκε!");
    // navigate('/admin/users'); // Go back to the user list
  };

  const handleCancel = async (userId) => {
    console.log("Rejecting user ID:", userId);
    // Here we will eventually add the fetch() call to the FastAPI backend
    alert("Η εγγραφή απορρίφθηκε!");
    // navigate('/admin/users'); // Go back to the user list
  };

  if (!userData) return <Typography>Φόρτωση...</Typography>;

  const cardStyle = {
    bgcolor: 'white', 
    width: '100%', 
    maxWidth: '1200px', 
    borderRadius: 2, 
    boxShadow: 3, 
    p: 4, 
    display: 'flex', 
    flexDirection: 'column'
  };

  return (
    <AppTheme {...props}>
      <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
        
        <Box 
          sx={{ 
            flex: 1, 
            bgcolor: 'background.default', 
            p: { xs: 2, md: 4 }, 
            display: 'flex', 
            justifyContent: 'center',
            overflowY: 'auto'
          }}
        >
          <Box sx={cardStyle}>
            
            {/* Header section with User Info on the left, Buttons on the right */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', // Pushes buttons to the right
              mb: 6, 
              flexDirection: { xs: 'column', sm: 'row' }, 
              color: 'text.primary', 
              gap: 3 
            }}>
              
              {/* Left Side: Avatar and Info */}
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }}}>
                <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
                   <PersonIcon sx={{ fontSize: 80, color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{userData.username}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.name} {userData.lastName}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.sex}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.email}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.phoneNumber}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.address}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.zip}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.afm}</Typography>
                </Box>
              </Box>

              {/* Right Side: Admin Action Buttons */}
              {userData.status === 'pending' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '200px' }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="large" 
                    sx={{ borderRadius: 5, fontWeight: 'bold' }} 
                    onClick={() => handleAccept(userData.id)}
                  >
                    ΕΓΚΡΙΣΗ ΑΙΤΗΣΗΣ
                  </Button>
                  <Button 
                    variant="contained" 
                    color="error" 
                    size="large" 
                    sx={{ borderRadius: 5, fontWeight: 'bold' }} 
                    onClick={() => handleCancel(userData.id)}
                  >
                    ΑΠΟΡΡΙΨΗ ΑΙΤΗΣΗΣ
                  </Button>
                </Box>
              )}
            </Box>

            {/* Bottom Section: Map or other details could go here */}
            <Grid container spacing={6}>
              <Grid item xs={12} md={8}> 
                 {/* Reserved space for map or extra details */}
              </Grid>
            </Grid>
            
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}