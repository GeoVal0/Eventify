import React, { useState, useEffect } from 'react';
import {Box, Typography, Button, Card, CardContent, Avatar, Select, MenuItem, FormControl, InputLabel, CircularProgress} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import {useAuth } from '../../context/AuthContext';
import {useNavigate } from 'react-router-dom';
import {getUsers, approveUser, rejectUser } from '../../api';

export default function ApplicationHistoryPage(props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [statusFilter, setStatusFilter] = useState('all');
  
  // fetch the real data from the backend
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getUsers();            // fetches from /api/admin/users[cite: 5]
      setApplications(data);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); 

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

  const getStatusLabel = (is_approved) => {
    if (is_approved) return 'ΕΠΙΒΕΒΑΙΩΜΕΝΟ';
    return 'ΕΚΚΡΕΜΕΙ ΕΠΙΒΕΒΑΙΩΣΗ';
  };

  const getStatusColor = (is_approved) => {
    if (is_approved) return 'success.main';
    if (is_approved === false) return 'error.main';
    return 'text.primary';
  };

  // connect action buttons to API
  const handleAccept = async (userId) => {
    try {
      await approveUser(userId);
      alert("Η εγγραφή εγκρίθηκε!");
      fetchData();                          // refresh list automatically
    } catch (err) {
      alert("Υπήρξε πρόβλημα κατά την έγκριση.");
    }
  };

  const handleCancel = async (userId) => {
    if(!window.confirm("Σίγουρα θέλετε να απορρίψετε αυτόν τον χρήστη;")) return;
    try {
      await rejectUser(userId);
      alert("Η εγγραφή απορρίφθηκε!");
      fetchData();                        // refresh list automatically
    } catch (err) {
      alert("Υπήρξε πρόβλημα κατά την απόρριψη.");
    }
  };

  // filter and sort
  const filteredApplications = applications
    .filter(app => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'accepted') return app.is_approved === true;
      if (statusFilter === 'pending') return app.is_approved === false;
      return false; // Backend permanently deletes rejected users, so 'rejected' yields nothing
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;

      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });


  if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', mt: 10}}><CircularProgress /></Box>;

  return (
    <AppTheme {...props}>
      <Box sx={{display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%'}}>
        <Box 
          sx={{
            flex: 1, 
            bgcolor: 'background.default', 
            p: { xs: 2, md: 4 }, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            overflowY: 'auto' 
         }}
        >
        
          <Box sx={{width: '100%', maxWidth: '1000px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2}}>
              <Box sx={{display: 'flex', gap: 2}}>
                  <FormControl size="small" sx={{minWidth: 200, bgcolor: 'white', borderRadius: 1}}>
                      <InputLabel>Ταξινόμηση</InputLabel>
                      <Select value={sortOrder} label="Ταξινόμηση" onChange={(e) => setSortOrder(e.target.value)}>
                          <MenuItem value="newest">Τα πιο πρόσφατα πρώτα</MenuItem>
                          <MenuItem value="oldest">Τα πιο παλιά πρώτα</MenuItem>
                      </Select>
                  </FormControl>

                  <FormControl size="small" sx={{minWidth: 200, bgcolor: 'white', borderRadius: 1}}>
                      <InputLabel>Κατάσταση</InputLabel>
                      <Select value={statusFilter} label="Κατάσταση" onChange={(e) => setStatusFilter(e.target.value)}>
                          <MenuItem value="all">Όλες</MenuItem>
                          <MenuItem value="pending">Εκκρεμεί</MenuItem>
                          <MenuItem value="accepted">Επιβεβαιωμένο</MenuItem>
                          <MenuItem value="rejected">Ακυρωμένο</MenuItem>
                      </Select>
                  </FormControl>
              </Box>
             
          </Box>

          <Box sx={{width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 2}}>
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => {

                return (
                  <Card 
                    key={app.id} 
                    variant="outlined" 
                    sx={{borderRadius: 4, bgcolor: 'white', border: '1px solid #c7c7c7', boxShadow: 'none'}}
                  >

                    <CardContent sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', p: 3, gap: 3}}>
                      <Box 
                        onClick={() => navigate('/admin/UserDetails', { state: { userId: app.id } })}
                        sx={{
                          display: 'flex',
                          flex: 1,
                          gap: 3,
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'scale(1.02)', 
                            opacity: 0.8,
                            boxShadow: 4
                          }
                       }}
                      >
                      <Avatar variant="rounded" sx={{width: 120, height: 120, bgcolor: '#5ba7fb', borderRadius: 2}}>
                        <PersonIcon sx={{fontSize: 90, color: 'white'}} />
                      </Avatar>

      
                      <Box sx={{flex: 1}}>
                        <Typography variant="h6" fontWeight="bold" sx={{color: 'black'}}>
                          {app.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ονοματεπώνυμο: {app.first_name} {app.last_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Email: {app.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Τηλέφωνο: {app.phone}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{mt: 1, color: 'black'}}>
                          ΡΟΛΟΣ: <Box component="span" sx={{fontWeight: 'normal', color: getRoleColor(app.role)}}>
                          {getRoleLabel(app.role)}
                          </Box>
                        </Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{color: 'black'}}>
                          ΚΑΤΑΣΤΑΣΗ: <Box component="span" sx={{color: getStatusColor(app.is_approved)}}>
                            {getStatusLabel(app.is_approved)}
                          </Box>
                        </Typography>
                        </Box>
                      </Box>

                      {/* show buttons only if the user is NOT approved */}
                      {app.is_approved === false && (
                        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
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
                            onClick={() => handleAccept(app.id)}
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
                            onClick={() => handleCancel(app.id)}
                          >
                          Απόρριψη Αίτησης
                          </Button>
                        </Box>
                      )}

                    </CardContent>
                  </Card>
                );
              })
            ) : (
                <Typography textAlign="center" color="text.secondary" sx={{mt: 4}}>Δεν βρέθηκαν χρήστες.</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}





/////////////////////////////////// PREPEI NA MHN DIAGRAFONTAI ENTELOS TA AITIMATA OTAN PATAEI APORIPSI ALLA NA DEIXNEI OTI EXOYN APORIFTHEI