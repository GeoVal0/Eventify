// import React, { useState, useEffect } from 'react';
// import { 
//   Box, Typography, Button, Avatar, Grid
// } from '@mui/material';
// import PersonIcon from '@mui/icons-material/Person';
// import AppTheme from '../../shared-theme/AppTheme';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext'; 

// export default function UserDetails(props) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useAuth(); 

//   // Fallback data in case you visit the page directly without clicking a link
//   const fallbackUser = {
//     id: 999,
//     username: "USERNAME",
//     name: "Γιώργος",
//     lastName: "Παπαδόπουλος",
//     sex: "Άνδρας",
//     email: "fj@gmail.com",
//     phoneNumber: "6999999999",
//     address: "Αριστοτέλους 15, Αθήνα",
//     zip: "12345",
//     afm: "123456789",
//     status: "pending" // Added status so the buttons show up!
//   };
  
//   const initialUser = location.state?.vet || fallbackUser; 
//   const [userData, setUserData] = useState(initialUser);

//   useEffect(() => {
//     if (!initialUser) navigate('/admin/UserDetails'); 
//   }, [initialUser, navigate]);

//   // --- Admin Action Handlers ---
//   const handleAccept = async (userId) => {
//     console.log("Accepting user ID:", userId);
//     // Here we will eventually add the fetch() call to the FastAPI backend
//     alert("Η εγγραφή εγκρίθηκε!");
//     navigate('/admin/UserList'); // Go back to the user list
//   };

//   const handleCancel = async (userId) => {
//     console.log("Rejecting user ID:", userId);
//     // Here we will eventually add the fetch() call to the FastAPI backend
//     alert("Η εγγραφή απορρίφθηκε!");
//     navigate('/admin/UserList'); // Go back to the user list
//   };

//   if (!userData) return <Typography>Φόρτωση...</Typography>;

//   const cardStyle = {
//     bgcolor: 'white', 
//     width: '100%', 
//     maxWidth: '1200px', 
//     borderRadius: 2, 
//     boxShadow: 3, 
//     p: 4, 
//     display: 'flex', 
//     flexDirection: 'column'
//   };

//   return (
//     <AppTheme {...props}>
//       <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
//         <Box 
//           sx={{ 
//             flex: 1, 
//             bgcolor: 'background.default', 
//             p: { xs: 2, md: 4 }, 
//             display: 'flex', 
//             justifyContent: 'center',
//             overflowY: 'auto'
//           }}
//         >
//           <Box sx={cardStyle}>
            
//             {/* Header section with User Info on the left, Buttons on the right */}
//             <Box sx={{ 
//               display: 'flex', 
//               alignItems: 'center', 
//               justifyContent: 'space-between', // Pushes buttons to the right
//               mb: 6, 
//               flexDirection: { xs: 'column', sm: 'row' }, 
//               color: 'text.primary', 
//               gap: 3 
//             }}>
              
//               {/* Left Side: Avatar and Info */}
//               <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }}}>
//                 <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
//                    <PersonIcon sx={{ fontSize: 80, color: 'white' }} />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{userData.username}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.name} {userData.lastName}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.sex}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.email}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.phoneNumber}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.address}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.zip}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{userData.afm}</Typography>
//                 </Box>
//               </Box>

//               {/* Right Side: Admin Action Buttons */}
//               {userData.status === 'pending' && (
//                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '200px' }}>
//                   <Button 
//                     variant="contained" 
//                     size="large" 
//                     sx={{ 
//                       background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
//                       fontWeight: 'bold', 
//                       color: 'white',
//                       border: '1px solid #2e7d32',
//                       boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
//                     }}
//                     onClick={() => handleAccept(userData.id)}
//                     >
//                     Έγκριση Αίτησης
//                   </Button>
//                   <Button 
//                     variant="contained" fullWidth
//                     sx={{ 
//                       background: 'linear-gradient(to bottom, rgb(245, 55, 74), rgb(129, 39, 39)) !important',
//                       // borderRadius: 5, 
//                       px: 4, py: 1.5,
//                       fontWeight: 'bold', 
//                       color: 'white',
//                       boxShadow: '0 3px 5px 2px rgba(129, 39, 39, .3)',
//                       whiteSpace: 'nowrap'
//                     }}
//                     onClick={() => handleCancel(userData.id)}
//                   >
//                   Απόρριψη Αίτησης
//                   </Button>
//                 </Box>
//               )}
//             </Box>

//             {/* Bottom Section: Map or other details could go here */}
//             <Grid container spacing={6}>
//               <Grid item xs={12} md={8}> 
//                  {/* Reserved space for map or extra details */}
//               </Grid>
//             </Grid>
//           </Box>
//         </Box>
//       </Box>
//     </AppTheme>
//   );
// }


import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Avatar, Grid, CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUserDetail, approveUser, rejectUser } from '../../api'; // Import your API functions

export default function UserDetails(props) {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the userId passed from the UserList navigation state
  const userId = location.state?.userId; 
  
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the real user data from the backend[cite: 5]
  useEffect(() => {
    if (!userId) {
      navigate('/admin/UserList'); 
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await getUserDetail(userId); // Calls GET /api/admin/users/{user_id}[cite: 5]
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

  // --- Admin Action Handlers connected to FastAPI[cite: 5] ---
  const handleAccept = async (id) => {
    try {
      await approveUser(id); // Calls PUT /api/admin/users/{user_id}/approve[cite: 5]
      alert("Η εγγραφή εγκρίθηκε!");
      navigate('/admin/UserList'); 
    } catch (err) {
      alert("Σφάλμα κατά την έγκριση.");
    }
  };

  const handleCancel = async (id) => {
    if(!window.confirm("Σίγουρα θέλετε να απορρίψετε αυτόν τον χρήστη;")) return;
    try {
      await rejectUser(id); // Calls PUT /api/admin/users/{user_id}/reject[cite: 5]
      alert("Η εγγραφή απορρίφθηκε!");
      navigate('/admin/UserList'); 
    } catch (err) {
      alert("Σφάλμα κατά την απόρριψη.");
    }
  };

  if (loading || !userData) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

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
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 6, 
              flexDirection: { xs: 'column', sm: 'row' }, 
              color: 'text.primary', 
              gap: 3 
            }}>
              
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }}}>
                <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
                   <PersonIcon sx={{ fontSize: 80, color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{userData.username}</Typography>
                  
                  {/* Map directly to backend schema fields[cite: 6] */}
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>
                    {userData.first_name} {userData.last_name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>
                    {userData.email}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>
                    {userData.phone}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>
                    {userData.address}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>
                    ΑΦΜ: {userData.afm}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>
                    Ρόλος: {userData.role}
                  </Typography>
                </Box>
              </Box>

              {/* Show buttons only if the user is strictly NOT approved[cite: 6] */}
              {!userData.is_approved && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '200px' }}>
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