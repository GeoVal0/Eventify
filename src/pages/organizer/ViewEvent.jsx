import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Avatar, Card, CardContent, Divider
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocationOffIcon from '@mui/icons-material/LocationOff'; 
import AppTheme from '../../shared-theme/AppTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Setup Map Icon
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ViewEvent(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); 

  // --- MOCK DATA: The Event Details (Top Section) ---
  const fallbackEvent = {
    id: 1,
    title: 'Συναυλία Νίκος Οικονομόπουλος',
    venue: 'OAKA',
    address: 'Λεωφόρος Σπύρου Λούη 1, Μαρούσι',
    date: '2026-09-15',
    time: '21:00',
    status: 'published',
    ticketsBought: 350,
    position: { lat: 38.0371, lng: 23.7840 }
  };
  
  const initialEvent = location.state?.event || fallbackEvent; 
  const [event, setEvent] = useState(initialEvent);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openCancelDialog, setCancelOpenDialog] = React.useState(false);

  // --- MOCK DATA: The Users who booked (Bottom Section) ---
  const bookedUsers = [
    {
      id: 101,
      username: "giorgos.papadopoulos",
      name: "Γιώργος",
      lastName: "Παπαδόπουλος",
      email: "giorgos.p@email.com",
      address: "Αριστοτέλους 15, Αθήνα",
      phone: "6999999991",
      ticketType: "VIP",
      quantity: 2,
      bookingDate: "2026-08-10"
    },
    {
      id: 102,
      username: "maria.konstantinou",
      name: "Μαρία",
      lastName: "Κωνσταντίνου",
      email: "maria.k@email.com",
      address: "Λεωφόρος Αθηνών 10, Αθήνα",
      phone: "6999999992",
      ticketType: "Γενική Είσοδος",
      quantity: 4,
      bookingDate: "2026-08-12"
    },
    {
      id: 103,
      username: "kostas.anastasiou",
      name: "Κώστας",
      lastName: "Αναστασίου",
      email: "kostas.a@email.com",
      address: "Πλατεία Συντάγματος 5, Αθήνα",
      phone: "6999999993",
      ticketType: "Γενική Είσοδος",
      quantity: 1,
      bookingDate: "2026-08-15"
    }
  ];

  useEffect(() => {
    if (!initialEvent) navigate('/owner/OwnerDashboard'); 
  }, [initialEvent, navigate]);

  // Helpers
  const hasValidLocation = (pos) => {
    return pos && typeof pos.lat === 'number' && typeof pos.lng === 'number' && (pos.lat !== 0 || pos.lng !== 0);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'ΔΗΜΟΣΙΕΥΜΕΝΗ';
      case 'draft': return 'ΠΡΟΣΩΡΙΝΑ ΑΠΟΘΗΚΕΥΜΕΝΗ';
      case 'cancelled': return 'ΑΚΥΡΩΜΕΝΗ';
      default: return status ? status.toUpperCase() : 'ΑΓΝΩΣΤΗ';
    }
  };

  const handleContactUser = (email) => {
    window.location.href = `mailto:${email}`;
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  const handleCancelOpenDialog = () => setCancelOpenDialog(true);
  const handleCancelCloseDialog = () => setCancelOpenDialog(false);

  const handleCancel = (eventID) => {
    setCancelOpenDialog(false);
    setEvent({...event, status: 'cancelled'})
    // alert("Η εκδήλωση ακυρώθηκε");
  }

  const handleDelete = () => {
    setOpenDialog(false);
    setEvent({...event, status: 'deleted'})
    // alert("Η εκδήλωση διαγράφηκε");
    // navigate('/organizer/ViewEvent')
  }

  if (!event) return <Typography>Φόρτωση...</Typography>;

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
          <Box sx={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            {/* 1. TOP SECTION: THE EVENT DETAILS CARD */}
            <Typography variant="h5" fontWeight="bold" sx={{ mb: -2 }}>Λεπτομέρειες Εκδήλωσης</Typography>
            
            <Card variant="outlined" sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid #c7c7c7', boxShadow: 'none', overflow: 'hidden' }}>
              <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, p: 0 }}>
                
                {/* Left Side: Map Block */}
                <Box sx={{ 
                  width: { xs: '100%', md: '350px' }, 
                  minHeight: '250px',
                  bgcolor: '#e3f2fd', 
                  borderRight: { xs: 'none', md: '1px solid #eee' },
                  borderBottom: { xs: '1px solid #eee', md: 'none' },
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {hasValidLocation(event.position) ? (
                      <MapContainer center={[event.position.lat, event.position.lng]} zoom={14} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[event.position.lat, event.position.lng]} icon={customIcon} />
                      </MapContainer>
                  ) : (
                      <Box sx={{ textAlign: 'center', opacity: 0.6, p: 2 }}>
                          <LocationOffIcon sx={{ fontSize: 50, color: '#9e9e9e' }} />
                          <Typography variant="caption" display="block" color="text.secondary">Χωρίς Τοποθεσία</Typography>
                      </Box>
                  )}
                </Box>

              {/* Right Side: Event Info & Buttons */}
                <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  
                  {/* --- TOP ROW: Details (Left) and Button (Right) --- */}
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    
                    {/* Left Side: Event Details */}
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Χώρος: {event.venue}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ημερομηνία: {event.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ώρα: {event.time}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Αριθμός Κρατήσεων: {event.ticketsBought}
                      </Typography>

                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ 
                          mt: 2, 
                          color: event.status === 'published' ? 'primary.main' : event.status === 'draft' ? 'warning.main' : 'error.main' 
                        }}
                      >
                        ΚΑΤΑΣΤΑΣΗ: {getStatusLabel(event.status)}
                      </Typography>
                    </Box>

                    {/* Right Side: Action Button */}
                    {/* <Box sx={{ mt: { xs: 2, sm: 0 } }}> Adds top margin only on mobile screens */}
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: '200px', alignItems: 'center' }}>
          
                      <Button 
                        variant="contained" fullWidth
                        sx={{ 
                          background: 'linear-gradient(to bottom, #8a8c8aff, #525151ff) !important',
                          borderRadius: 5, 
                          px: 4, py: 1.5, 
                          fontWeight: 'bold', 
                          color: 'white',
                          border: '1px solid #3e3e3eff',
                          boxShadow: '0 3px 5px 2px rgba(47, 52, 47, 0.3)',
                          whiteSpace: 'nowrap'
                        }}
                        onClick={handleCancelOpenDialog}
                      >
                        ΑΚΥΡΩΣΗ ΕΚΔΗΛΩΣΗΣ
                      </Button>


                      <Button 
                        variant="contained" fullWidth
                        onClick={handleOpenDialog}
                        sx={{ 
                          background: 'linear-gradient(to bottom, rgb(245, 55, 74), rgb(129, 39, 39)) !important',
                          borderRadius: 5, 
                          px: 4, py: 1.5,
                          fontWeight: 'bold', 
                          color: 'white',
                          boxShadow: '0 3px 5px 2px rgba(129, 39, 39, .3)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ΔΙΑΓΡΑΦΗ ΕΚΔΗΛΩΣΗΣ
                      </Button>
                    </Box>

                  </Box>
                  {/* --- END TOP ROW --- */}

                  <Divider sx={{ my: 2 }} />

                  {/* BOTTOM ROW: Total Tickets */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">ΣΥΝΟΛΙΚΕΣ ΚΡΑΤΗΣΕΙΣ</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">{event.ticketsBought} Εισιτήρια</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>


            {/* 2. BOTTOM SECTION: THE BOOKED USERS LIST */}
            <Typography variant="h5" fontWeight="bold" sx={{ mt: 2, mb: -2 }}>
               Λίστα Κρατήσεων ({bookedUsers.length})
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {bookedUsers.length > 0 ? (
                bookedUsers.map((bookedUser) => (
                  <Card 
                    key={bookedUser.id} 
                    variant="outlined" 
                    sx={{ 
                      borderRadius: 3, bgcolor: 'white', border: '1px solid #e0e0e0', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', p: 2,
                      flexDirection: { xs: 'column', sm: 'row' }, gap: 2
                    }}
                  >
                  <CardContent sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', p: 3, gap: 3 }}>
                    <Avatar variant="rounded" sx={{ width: 80, height: 80, bgcolor: '#5ba7fb', borderRadius: 2 }}>
                      <PersonIcon sx={{ fontSize: 40, color: 'white' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>
                        {bookedUser.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {bookedUser.name} {bookedUser.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {bookedUser.address || 'Διεύθυνση -'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {bookedUser.email}
                      </Typography>
                    </Box>
                  </CardContent>

                    {/* Ticket Info */}
                    <Box sx={{ textAlign: { xs: 'center', sm: 'right' }, borderLeft: { xs: 'none', sm: '1px solid #eee' }, pl: { xs: 0, sm: 3 } }}>
                      <Typography variant="caption" color="text.secondary" display="block">ΚΑΤΗΓΟΡΙΑ: {bookedUser.ticketType}</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {bookedUser.quantity} {bookedUser.quantity === 1 ? 'Εισιτήριο' : 'Εισιτήρια'}
                      </Typography>
                    </Box>

                    {/* Action Button */}
                    <Box sx={{ ml: { xs: 0, sm: 2 } }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{ borderRadius: 5, fontWeight: 'bold' }}
                        onClick={() => handleContactUser(bookedUser.email)}
                      >
                        ΕΠΙΚΟΙΝΩΝΙΑ
                      </Button>
                    </Box>
                  </Card>
                ))
              ) : (
                <Typography textAlign="center" color="text.secondary" sx={{ mt: 4, py: 6, bgcolor: 'white', borderRadius: 4, border: '1px dashed #ccc' }}>
                  Δεν υπάρχουν ακόμα κρατήσεις για αυτή την εκδήλωση.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <Dialog
        open={openCancelDialog}
        onClose={handleCancelCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{ '& .MuiDialog-paper': { bgcolor: 'white' } }}
      >
        <DialogTitle id="alert-dialog-title">
          {"Είστε σίγουροι για την ακύρωση της εκδήλωσης;"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Αν προχωρήσετε, η εκδήλωση <strong>{event.title}</strong> θα ακυρωθεί και δεν θα μπορούν να γίνουν νέες κρατήσεις.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCloseDialog} autoFocus variant="contained">
            Ακύρωση
          </Button>
          <Button onClick={handleCancel} autoFocus variant="contained">
            Επιβεβαίωση Ακύρωσης
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{ '& .MuiDialog-paper': { bgcolor: 'white' } }}
      >
        <DialogTitle id="alert-dialog-title">
          {"Είστε σίγουροι για τη διαγραφή της εκδήλωσης;"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Αν προχωρήσετε, η εκδήλωση <strong>{event.title}</strong> θα διαγραφεί οριστικά και δεν θα μπορούν να γίνουν νέες κρατήσεις.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} autoFocus variant="contained">
            Ακύρωση
          </Button>
          <Button onClick={handleDelete} autoFocus variant="contained">
            Επιβεβαίωση Διαγραφής
          </Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
}