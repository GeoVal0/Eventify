// import React, { useState, useEffect } from 'react';
// import { 
//   Box, Typography, Button, Card, CardContent, Avatar, 
//   Select, MenuItem, FormControl, InputLabel, CircularProgress,
//   Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
//   Rating, IconButton
// } from '@mui/material';
// import PersonIcon from '@mui/icons-material/Person';
// import CloseIcon from '@mui/icons-material/Close';
// import AppTheme from '../../shared-theme/AppTheme';
// import { useAuth } from '../../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// import { getUsers, approveUser, rejectUser } from '../../api'; // Import API functions

// export default function UserList(props) {
//   // const { user } = useAuth();
//   const navigate = useNavigate();
  
//   const [applications, setApplications] = useState([]);
//   const [loading, setLoading] = useState(true);
  
//   // filters
//   const [sortOrder, setSortOrder] = useState('newest'); 
//   const [statusFilter, setStatusFilter] = useState('all');

//   // const [openDialog, setOpenDialog] = useState(false);
//   // const [selectedAppt, setSelectedAppt] = useState(null); 
//   // const [rating, setRating] = useState(0);
//   // const [comment, setComment] = useState('');
//   // const [userData, setUserData] = useState('');


//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       const data = await getUsers(); // Fetches from /api/admin/users[cite: 5]
//       setApplications(data);
//     } catch (error) {
//       console.error("Error fetching users:", error);
//     } finally {
//       setLoading(false);
//     }
//   };
  



//   // get data (MOCK DATA FOR TESTING UI)
//   useEffect(() => {
    
//     // ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΟ ΠΡΟΣΩΡΙΝΑ: 
//     // Δεν ελέγχουμε αν υπάρχει χρήστης για να δούμε το UI
//     // if (!user) {
//     //   setLoading(false);
//     //   return; 
//     // }

//     // const fetchMockData = async () => {
//     //   setLoading(true);
//     //   try {
//     //     await new Promise(resolve => setTimeout(resolve, 500));

//     //     const dummyData = [
//     //       {
//     //         id: 1,
//     //         date: "2026-07-20",
//     //         time: "10:30",
//     //         status: "accepted",
//     //         organizerDetails: { 
//     //           username: "USERNAME",
//     //           name: "Ονομα", 
//     //           lastName: "Επώνυμο",
//     //           address: "Λεωφόρος Κηφισίας 123, Αθήνα",
//     //           email: "dsshd@gmail.com"
//     //         }
//     //       },
//     //       {
//     //         id: 2,
//     //         date: "2026-07-22",
//     //         time: "18:00",
//     //         status: "pending",
//     //         organizerDetails: { 
//     //           username: "USERNAME",
//     //           name: "Ονομα", 
//     //           lastName: "Επώνυμο",
//     //           address: "Τσιμισκή 45, Θεσσαλονίκη", 
//     //           email: "dsshd@gmail.com"
//     //         }
//     //       },
//     //       {
//     //         id: 3,
//     //         date: "2026-07-10",
//     //         time: "09:15",
//     //         status: "rejected",
//     //         organizerDetails: { 
//     //           username: "USERNAME",
//     //           name: "Ονομα", 
//     //           lastName: "Επώνυμο",
//     //           address: "Αγίου Ανδρέου 8, Πάτρα", 
//     //           email: "dsshd@gmail.com"
//     //         }
//     //       }
//     //     ];

//     //     setApplications(dummyData);
//     //   } catch (error) {
//     //     console.error("Error fetching history:", error);
//     //   } finally {
//     //     setLoading(false);
//     //   }
//     // };

//     fetchData();
//   }, []); // Αφαιρέσαμε και το [user] από εδώ για να τρέξει σίγουρα μία φορά!

//   const handleAccept = async (userId) => {
//     try {
//       await approveUser(userId); // Calls PUT /api/admin/users/{user_id}/approve[cite: 5]
//       alert("Η εγγραφή εγκρίθηκε!");
//       fetchRealData(); // Refresh the list
//     } catch (err) {
//       alert("Σφάλμα κατά την έγκριση.");
//     }
//   };

//   const handleCancel = async (userId) => {
//     if(!window.confirm("Σίγουρα θέλετε να απορρίψετε αυτόν τον χρήστη;")) return;
//     try {
//       await rejectUser(userId); // Calls PUT /api/admin/users/{user_id}/reject[cite: 5]
//       alert("Η εγγραφή απορρίφθηκε!");
//       fetchRealData(); // Refresh the list
//     } catch (err) {
//       alert("Σφάλμα κατά την απόρριψη.");
//     }
//   };


//   const getStatusLabel = (status) => {
//     switch (status) {
//       case 'pending': return 'ΕΚΚΡΕΜΕΙ ΕΠΙΒΕΒΑΙΩΣΗ';
//       case 'accepted': return 'ΕΠΙΒΕΒΑΙΩΜΕΝΟ';          //επιβεβαιωμενος λογαριασμος;;; επιβεβαιωμενη αιτηση;; επιβεβαιωμενο προφιλ;
//       case 'rejected': return 'ΑΚΥΡΩΜΕΝΟ';
//       default: return status;
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'pending': return 'text.primary'; 
//       case 'accepted': return 'success.main';
//       case 'rejected': return 'error.main';
//       default: return 'text.primary';
//     }
//   };

//   //  const handleAccept = async (userId) => {
//   //   console.log("Accepting user ID:", userId);
//   //   // Here we will eventually add the fetch() call to the FastAPI backend
//   //   alert("Η εγγραφή εγκρίθηκε!");
//   //   navigate('/admin/UserList'); // Go back to the user list
//   // };

//   // const handleCancel = async (userId) => {
//   //   console.log("Rejecting user ID:", userId);
//   //   // Here we will eventually add the fetch() call to the FastAPI backend
//   //   alert("Η εγγραφή απορρίφθηκε!");
//   //   navigate('/admin/UserList'); // Go back to the user list
//   // };

//   // date format
//   const parseDateTime = (dateStr, timeStr) => {
//     let d = new Date(`${dateStr}T${timeStr}`);
//     if (isNaN(d.getTime())) {
//       d = new Date(`${dateStr} ${timeStr}`);
//     }
    
//     return d;
//   };
//   const formatDisplayDate = (dateObj) => {
//     if (isNaN(dateObj.getTime())) return "Invalid Date";
    
//     const dayName = dateObj.toLocaleDateString('el-GR', { weekday: 'long' }).toUpperCase();
//     const fullDate = dateObj.toLocaleDateString('el-GR', { day: 'numeric', month: 'numeric', year: 'numeric' });
    
//     const time = dateObj.toLocaleTimeString('el-GR', { 
//         hour: '2-digit', 
//         minute: '2-digit', 
//         hour12: false
//     });
    
//     return `${dayName} ${fullDate} ${time}`;
//   };

//   const filteredApplications = applications
//     .filter(app => {
//       if (statusFilter === 'all') return true;
//       return app.status === statusFilter;
//     })
//     .sort((a, b) => {
//       const dateA = parseDateTime(a.date, a.time);
//       const dateB = parseDateTime(b.date, b.time);
      
//       if (isNaN(dateA.getTime())) return 1;
//       if (isNaN(dateB.getTime())) return -1;

//       return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
//     });

//   if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

//   return (
//     <AppTheme {...props}>
//       <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
//         <Box 
//           sx={{ 
//             flex: 1, 
//             bgcolor: 'background.default', 
//             p: { xs: 2, md: 4 }, 
//             display: 'flex', 
//             flexDirection: 'column', 
//             alignItems: 'center',
//             overflowY: 'auto' 
//           }}
//         >
        
//           <Box sx={{ width: '100%', maxWidth: '1000px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
//               <Box sx={{ display: 'flex', gap: 2 }}>
//                   <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
//                       <InputLabel>Ταξινόμηση</InputLabel>
//                       <Select value={sortOrder} label="Ταξινόμηση" onChange={(e) => setSortOrder(e.target.value)}>
//                           <MenuItem value="newest">Τα πιο πρόσφατα πρώτα</MenuItem>
//                           <MenuItem value="oldest">Τα πιο παλιά πρώτα</MenuItem>
//                       </Select>
//                   </FormControl>

//                   <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
//                       <InputLabel>Κατάσταση</InputLabel>
//                       <Select value={statusFilter} label="Κατάσταση" onChange={(e) => setStatusFilter(e.target.value)}>
//                           <MenuItem value="all">Όλες</MenuItem>
//                           <MenuItem value="pending">Εκκρεμεί</MenuItem>
//                           <MenuItem value="accepted">Επιβεβαιωμένο</MenuItem>
//                           <MenuItem value="rejected">Ακυρωμένο</MenuItem>
//                       </Select>
//                   </FormControl>
//               </Box>
//           </Box>

//           <Box sx={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 2 }}>
//             {filteredApplications.length > 0 ? (
//               filteredApplications.map((app) => {
//                 const dateObj = parseDateTime(app.date, app.time);
//                 const displayString = formatDisplayDate(dateObj);

//                 return (
//                   <Card 
//                     key={app.id} 
//                     variant="outlined" 
//                     sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid #c7c7c7', boxShadow: 'none' }}
//                   >

//                     <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', p: 3, gap: 3 }}>
//                       <Avatar variant="rounded" sx={{ width: 80, height: 80, bgcolor: '#5ba7fb', borderRadius: 2 }}>
//                         <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
//                       </Avatar>

//                       {/* Main Content Area */}
//                       <Box sx={{ flex: 1 }}>
//                         <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>
//                           {app.organizerDetails.username}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           {app.organizerDetails.name} {app.organizerDetails.lastName}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           {app.organizerDetails.address || 'Διεύθυνση -'}
//                         </Typography>
//                         <Typography variant="body2" color="text.secondary">
//                           {app.organizerDetails.email}
//                         </Typography>
                        
//                         <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, color: 'black' }}>
//                           ΚΑΤΑΣΤΑΣΗ: <span style={{ color: getStatusColor(app.status) === 'success.main' ? '#2e7d32' : getStatusColor(app.status) === 'error.main' ? '#d32f2f' : 'black' }}>
//                             {getStatusLabel(app.status)}
//                           </span>
//                         </Typography>
//                       </Box>

//                       {/* Action Buttons (Only show when pending) */}
//                       {app.status === 'pending' && (
//                         <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
//                           <Button 
//                             variant="contained" 
//                             size="large" 
//                             sx={{ 
//                               background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
//                               fontWeight: 'bold', 
//                               color: 'white',
//                               border: '1px solid #2e7d32',
//                               boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
//                             }}
//                             onClick={() => handleAccept(userData.id)}
//                             >
//                             Έγκριση Αίτησης
//                           </Button>
//                           <Button 
//                             variant="contained" fullWidth
//                             sx={{ 
//                               background: 'linear-gradient(to bottom, rgb(245, 55, 74), rgb(129, 39, 39)) !important',
//                               // borderRadius: 5, 
//                               px: 4, py: 1.5,
//                               fontWeight: 'bold', 
//                               color: 'white',
//                               boxShadow: '0 3px 5px 2px rgba(129, 39, 39, .3)',
//                               whiteSpace: 'nowrap'
//                             }}
//                             onClick={() => handleCancel(userData.id)}
//                           >
//                           Απόρριψη Αίτησης
//                           </Button>
//                         </Box>
//                       )}

//                     </CardContent>
//                   </Card>
//                 );
//               })
//             ) : (
//                 <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>Δεν βρέθηκαν χρήστες.</Typography>
//             )}
//           </Box>
//         </Box>
//       </Box>
//     </AppTheme>
//   );
// }

import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, Avatar, 
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Rating, IconButton
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import AppTheme from '../../shared-theme/AppTheme';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getUsers, approveUser, rejectUser } from '../../api'; // Added real API calls

export default function ApplicationHistoryPage(props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // filters
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [statusFilter, setStatusFilter] = useState('all');

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null); 
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [userData, setUserData] = useState('');
  
  // 1. Fetch real data from FastAPI
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getUsers(); // Fetches from /api/admin/users[cite: 5]
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

  // 2. Map boolean is_approved to your custom string labels[cite: 5, 6]
  const getStatusLabel = (is_approved) => {
    if (is_approved) return 'ΕΠΙΒΕΒΑΙΩΜΕΝΟ';
    return 'ΕΚΚΡΕΜΕΙ ΕΠΙΒΕΒΑΙΩΣΗ';
  };

  const getStatusColor = (is_approved) => {
    if (is_approved) return 'success.main';
    return 'text.primary';
  };

  // 3. Connect buttons to API[cite: 5]
  const handleAccept = async (userId) => {
    try {
      await approveUser(userId);
      alert("Η εγγραφή εγκρίθηκε!");
      fetchRealData(); // Refresh list automatically
    } catch (err) {
      alert("Υπήρξε πρόβλημα κατά την έγκριση.");
    }
  };

  const handleCancel = async (userId) => {
    if(!window.confirm("Σίγουρα θέλετε να απορρίψετε αυτόν τον χρήστη;")) return;
    try {
      await rejectUser(userId);
      alert("Η εγγραφή απορρίφθηκε!");
      fetchRealData(); // Refresh list automatically
    } catch (err) {
      alert("Υπήρξε πρόβλημα κατά την απόρριψη.");
    }
  };

  // 4. Handle FastAPI's created_at ISO timestamp[cite: 6]
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

  // 5. Filter and Sort using real backend fields[cite: 5, 6]
  const filteredApplications = applications
    .filter(app => {
      if (statusFilter === 'all') return true;
      if (statusFilter === 'accepted') return app.is_approved === true;
      if (statusFilter === 'pending') return app.is_approved === false;
      return false; // Backend permanently deletes rejected users, so 'rejected' yields nothing[cite: 5]
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;

      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <AppTheme {...props}>
      <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
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
        
          <Box sx={{ width: '100%', maxWidth: '1000px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
                      <InputLabel>Ταξινόμηση</InputLabel>
                      <Select value={sortOrder} label="Ταξινόμηση" onChange={(e) => setSortOrder(e.target.value)}>
                          <MenuItem value="newest">Τα πιο πρόσφατα πρώτα</MenuItem>
                          <MenuItem value="oldest">Τα πιο παλιά πρώτα</MenuItem>
                      </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
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

          <Box sx={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => {
                const displayString = formatDisplayDate(app.created_at);

                return (
                  <Card 
                    key={app.id} 
                    variant="outlined" 
                    sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid #c7c7c7', boxShadow: 'none' }}
                  >

                    <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', p: 3, gap: 3 }}>
                      <Box 
                        onClick={() => navigate('/admin/UserDetails', { state: { userId: app.id } })}
                        sx={{
                          display: 'flex',
                          flex: 1,
                          gap: 3,
                          alignItems: 'center',
                          cursor: 'pointer',
                          '&:hover': { opacity: 0.7 }
                        }}
                      >
                      <Avatar variant="rounded" sx={{ width: 80, height: 80, bgcolor: '#5ba7fb', borderRadius: 2 }}>
                        <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
                      </Avatar>

                      {/* 6. Map to the flat backend User structure[cite: 6] */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>
                          {app.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.first_name} {app.last_name} | Εγγραφή: {displayString}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.address || 'Διεύθυνση -'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.email}
                        </Typography>
                        
                        <Typography variant="body2" fontWeight="bold" sx={{ mt: 1, color: 'black' }}>
                          ΚΑΤΑΣΤΑΣΗ: <span style={{ color: getStatusColor(app.is_approved) === 'success.main' ? '#2e7d32' : 'black' }}>
                            {getStatusLabel(app.is_approved)}
                          </span>
                        </Typography>
                        </Box>
                      </Box>

                      {/* Action Buttons (Only show when pending) */}
                      {app.is_approved === false && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                            onClick={() => handleAccept(app.id)} // Fixed: was userData.id
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
                            onClick={() => handleCancel(app.id)} // Fixed: was userData.id
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
                <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>Δεν βρέθηκαν χρήστες.</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}





/////////////////////////////////// PREPEI NA MHN DIAGRAFONTAI ENTELOS TA AITIMATA OTAN PATAEI APORIPSI ALLA NA DEIXNEI OTI EXOYN APORIFTHEI