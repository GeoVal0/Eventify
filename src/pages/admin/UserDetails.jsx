import React, { useState, useEffect } from 'react';
import {Box, Typography, Button, Avatar, Grid, CircularProgress } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import {useLocation, useNavigate } from 'react-router-dom';
import {getUserDetail, approveUser, rejectUser } from '../../api';

export default function UserDetails(props) {
  const navigate = useNavigate();
  const location = useLocation();

  // extract the userId passed from the UserList navigation state
  const userId = location.state?.userId; 
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // fetch the real user data from the backend
  useEffect(() => {
    if (!userId) {
      navigate('/admin/UserList'); 
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await getUserDetail(userId);        // calls GET /api/admin/users/{user_id}
        setUserData(data);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        alert("Αδυναμία φόρτωσης χρήστη.");
        navigate('/admin/UserList');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  // helpers

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ORGANIZER': return 'ΔΙΟΡΓΑΝΩΤΗΣ';
      case 'ATTENDEE': return 'ΣΥΜΜΕΤΕΧΩΝ';
      case 'ADMIN': return 'ΔΙΑΧΕΙΡΙΣΤΗΣ';
      default: return role;
    }
  };

  const getRoleColor = (role) => {
    if (role === 'ADMIN') return 'error.main';
    if (role === 'ORGANIZER') return 'primary.main';
    return 'warning.main';
  }

  const formatDisplayDate = (dateString) => {
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    
    const dayName = dateObj.toLocaleDateString('el-GR', { weekday: 'long' }).toUpperCase();
    const fullDate = dateObj.toLocaleDateString('el-GR', { day: 'numeric', month: 'numeric', year: 'numeric' });
    
    const time = dateObj.toLocaleTimeString('el-GR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false
    });
    
    return `${dayName} ${fullDate} ${time}`;
  };

  // admin action handlers connected to fastAPI
  const handleAccept = async (id) => {
    try {
      await approveUser(id);                // calls PUT /api/admin/users/{user_id}/approve
      alert("Η εγγραφή εγκρίθηκε!");
      navigate('/admin/UserList'); 
    } catch (err) {
      alert("Σφάλμα κατά την έγκριση.");
    }
  };

  const handleCancel = async (id) => {
    if(!window.confirm("Σίγουρα θέλετε να απορρίψετε αυτόν τον χρήστη;")) return;
    try {
      await rejectUser(id);               // calls PUT /api/admin/users/{user_id}/reject
      alert("Η εγγραφή απορρίφθηκε!");
      navigate('/admin/UserList'); 
    } catch (err) {
      alert("Σφάλμα κατά την απόρριψη.");
    }
  };

  if (loading || !userData) return <Box sx={{display: 'flex', justifyContent: 'center', mt: 10}}><CircularProgress /></Box>;

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
  const displayString = formatDisplayDate(userData.created_at);

  return (
    <AppTheme {...props}>
      <Box sx={{display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%'}}>
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
            
            <Box sx={{
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 6, 
              flexDirection: { xs: 'column', sm: 'row' }, 
              color: 'text.primary', 
              gap: 3 
           }}>
              
              <Box sx={{display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row'}}}>
                <Avatar variant="rounded" sx={{width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2}}>
                   <PersonIcon sx={{fontSize: 130, color: 'white'}} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{mb: 1}}>{userData.username}</Typography>
                  
                  {/* map directly to backend schema fields */}
                  <Typography variant="body1" sx={{color: 'text.secondary', fontSize: '1.25rem'}}>
                    Ονοματεπώνυμο: {userData.first_name} {userData.last_name}
                  </Typography>
                  <Typography variant="body1" sx={{color: 'text.secondary', fontSize: '1.25rem'}}>
                    Email: {userData.email}
                  </Typography>
                  <Typography variant="body1" sx={{color: 'text.secondary', fontSize: '1.25rem'}}>
                    Τηλέφωνο: {userData.phone}
                  </Typography>
                  <Typography variant="body1" sx={{color: 'text.secondary', fontSize: '1.25rem'}}>
                    Διεύθυνση: {userData.address}
                  </Typography>
                  <Typography variant="body1" sx={{color: 'text.secondary', fontSize: '1.25rem'}}>
                    ΑΦΜ: {userData.afm}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{mt: 1, color: 'black', fontSize: '1.25rem'}}>
                    ΡΟΛΟΣ: <Box component="span" sx={{fontWeight: 'normal', color: getRoleColor(userData.role)}}>
                    {getRoleLabel(userData.role)}
                    </Box>
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={{color: 'black', fontSize: '1.25rem'}}>
                    ΕΓΓΡΑΦΗ: <Box component="span" sx={{fontWeight: 'normal', color: 'success.main'}}>
                      {displayString}
                    </Box>
                  </Typography>
                </Box>
              </Box>

               {/* show buttons only if the user is NOT approved */}
              {!userData.is_approved && (
                <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, minWidth: '200px'}}>
                  <Button 
                    variant="contained" 
                    size="large" 
                    sx={{
                      background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
                      fontWeight: 'bold', 
                      color: 'white',
                      border: '1px solid #2e7d32',
                      boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                   }}
                    onClick={() => handleAccept(userData.id)}
                    >
                    Έγκριση Αίτησης
                  </Button>
                  <Button 
                    variant="contained" fullWidth
                    sx={{
                      background: 'linear-gradient(to bottom, rgb(245, 55, 74), rgb(129, 39, 39)) !important',
                      px: 4, py: 1.5,
                      fontWeight: 'bold', 
                      color: 'white',
                      boxShadow: '0 3px 5px 2px rgba(129, 39, 39, .3)',
                      border: '1px solid #c50c0c', boxShadow: '0 3px 5px 2px rgba(230, 0, 0, 0.3)',
                      whiteSpace: 'nowrap'
                   }}
                    onClick={() => handleCancel(userData.id)}
                  >
                  Απόρριψη Αίτησης
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={6}>
              <Grid item xs={12} md={8}></Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}