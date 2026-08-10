import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Avatar, Grid, Card, Select, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';



const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});


export default function BookTickets(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); 

  // 1. Capture the exact event the user clicked on from the Search Page!
  const event = location.state?.event;

  const [selectedTickets, setSelectedTickets] = useState({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const handleBooking = () => {
    if (!user){
      navigate('/login');
    }
    else {
      setOpenConfirmDialog(true);
    }
  }

  const handleConfirm = () => {
    setOpenConfirmDialog(false);
  }

  // --- Admin Action Handlers ---
  const handleAccept = async (userId) => {
    console.log("Accepting user ID:", userId);
    alert("Η εγγραφή εγκρίθηκε!");
  };

  const handleCancel = async (userId) => {
    console.log("Rejecting user ID:", userId);
    alert("Η εγγραφή απορρίφθηκε!");
  };

  const handleTicketsChange = (ticketTypeID, quantity) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeID]: quantity
    }));
  }

  const availabilityColor = (available, total) => {
    if (available === 0) return '#d32f2f';
    if (available <= (total * 0.2)) return '#ed6c02';
    return '#4caf50';
  }

  // 2. Safety check: If someone refreshes the page and the event gets lost, show an error
  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Δεν βρέθηκε η εκδήλωση.</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }} variant="contained">
          ΕΠΙΣΤΡΟΦΗ ΣΤΗΝ ΑΝΑΖΗΤΗΣΗ
        </Button>
      </Box>
    );
  }

  const latitude = event.geoLocation?.latitude ? parseFloat(event.geoLocation.latitude) : 37.9838; // Default to Athens
  const longitude = event.geoLocation?.longitude ? parseFloat(event.geoLocation.longitude) : 23.7275; // Default to Athens
  const position = [latitude, longitude];

  const grandtotal = event.ticketTypes ? event.ticketTypes.reduce((total, ticket) => {
    const selectedQuantity = selectedTickets[ticket.ticketTypeID] || 0;
    return total + (selectedQuantity * ticket.price);
  }, 0) : 0;

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

  const buttonStyle = {
    background: 'linear-gradient(to bottom, #2f94f8ff, #0f4d8aff) !important',
    borderRadius: 5,
    px: 3, py: 1,
    fontWeight: 'bold', color: 'white',
    border: '1px solid #1976d2',
    boxShadow: '0 3px 5px 2px rgba(53, 77, 162, 0.3)',
    textTransform: 'none',
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
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{event.title}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{event.venue}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{event.address}, {event.city}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{new Date(event.startDateTime).toLocaleString('el-GR')}</Typography>
                </Box>
              </Box>
            </Box>

            {/* <Grid container spacing={6} justifyContent="flex-end">
              <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>  */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 4 }}>
                <Box sx={{ width: '600px' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Περιγραφή Εκδήλωσης: </Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>{event.description}</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', width: '400px' }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Τοποθεσία Εκδήλωσης:</Typography>
                  <Box sx={{ height: '200px', width: '400px', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                    <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={position} icon={customIcon}>
                        <Popup>
                          {event.title} <br /> {event.address}, {event.city}
                        </Popup>
                      </Marker>
                    </MapContainer>
                  </Box> 
                </Box>
              </Box>
                {/* 2. Bottom Section: Tickets (Spans the full width below the map and description) */}
              <Box sx={{ width: '100%', mt: 6, pt: 4, borderTop: '1px solid #eee' }}>
                <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Εισιτήρια:</Typography>
                
                {/* Check if ticket types exist before mapping */}
                {event.ticketTypes && event.ticketTypes.length > 0 ? (
                  <Grid container spacing={3}>
                    {event.ticketTypes.map((ticket) => (
                      <Grid item xs={12} sm={6} md={4} key={ticket.ticketTypeID}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            borderRadius: 2, 
                            p: 2, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            height: '80%',
                            width: '330px',
                            borderLeft: '15px solid',
                            borderLeftColor: availabilityColor(ticket.available, ticket.quantity),
                            bgcolor: 'white',
                          }}
                        >
                          {/* Ticket Info */}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight="bold">{ticket.name}</Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ color: '#1976d2', mt: 1, mb: 1 }}>{ticket.price}€</Typography>
                            
                            {/* Dynamic Availability Text */}
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              sx={{ color: ticket.available > 0 ? 'success.main' : 'error.main' }}
                            >
                              {ticket.available === 0 && (
                                <Typography variant="body2" color="error.main" fontWeight="bold">Sold Out</Typography>
                              )}
                            </Typography>
                          </Box>


                          <Box sx={{ mt: 3, width: '100%', display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>Ποσότητα: </Typography>
                              <Select
                                value={selectedTickets[ticket.ticketTypeID] || 0}
                                onChange={(e) => handleTicketsChange(ticket.ticketTypeID, e.target.value)}
                                sx={{ mt: 2, mb: 2, width: '40%' }}
                                disabled={ticket.available === 0}
                              >
                                <MenuItem value={0}>0</MenuItem>
                                <MenuItem value={1}>1</MenuItem>
                                <MenuItem value={2}>2</MenuItem>
                                <MenuItem value={3}>3</MenuItem>
                                <MenuItem value={4}>4</MenuItem>
                                <MenuItem value={5}>5</MenuItem>
                                <MenuItem value={6}>6</MenuItem>
                                <MenuItem value={7}>7</MenuItem>
                                <MenuItem value={8}>8</MenuItem>
                                <MenuItem value={9}>9</MenuItem>
                                <MenuItem value={10}>10</MenuItem>
                              </Select>
                            </Box>
                            <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>Σύνολο: {(selectedTickets[ticket.ticketTypeID] || 0) * ticket.price}€</Typography>
                          </Box>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">Δεν υπάρχουν διαθέσιμα εισιτήρια αυτή τη στιγμή.</Typography>
                )}
            </Box>
            <Typography variant="h5" sx={{ alignSelf: 'center' }}> Σύνολο: {grandtotal}€</Typography>
            <Button variant="contained" sx={{ ...buttonStyle, borderRadius: 1, alignSelf: 'center' }} onClick={handleBooking}>
              ΚΡΑΤΗΣΗ ΕΙΣΙΤΗΡΙΩΝ
            </Button>
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
              <DialogTitle>Επιβεβαίωση Κράτησης</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Είστε σίγουροι ότι θέλετε να προχωρήσετε με την κράτηση των επιλεγμένων εισιτηρίων;
                  Συνολικό Κόστος: {grandtotal}€
                </DialogContentText>
              </DialogContent>
              <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
                  ΑΚΥΡΩΣΗ
                </Button>
                <Button onClick={handleConfirm} color="primary" variant="contained">
                  ΕΠΙΒΕΒΑΙΩΣΗ
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}