import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Avatar, Grid, Card, Select, MenuItem, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress
} from '@mui/material';
import AppTheme from '../../shared-theme/AppTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { createBooking, getEventDetail } from '../../api'; 

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

  const event = location.state?.event;

  const [fullEvent, setFullEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  useEffect(() => {
    if (!event) return;

    const fetchFullData = async () => {
      try {
        const data = await getEventDetail(event.event_id || event.id);
        setFullEvent(data);
      } catch (error) {
        console.error("Failed to load full event data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFullData();
  }, [event]);

  const handleBooking = () => {
    if (!user){
      navigate('/login');
    }
    else {
      setOpenConfirmDialog(true);
    }
  }

const handleConfirm = async () => {
    const requestedTickets = Object.entries(selectedTickets)
      .filter(([id, quantity]) => quantity > 0)
      .map(([id, quantity]) => ({
        ticket_type_id: id,
        number_of_tickets: quantity
      }));

    try {
      for (const ticket of requestedTickets) {
        const payload = {
          ticket_type_id: ticket.ticket_type_id,
          number_of_tickets: ticket.number_of_tickets
        };
        await createBooking(fullEvent.event_id, payload);
      }
      
      alert("Η κράτηση ολοκληρώθηκε επιτυχώς!");
      setOpenConfirmDialog(false);
      // navigate('/user/UserDashboard'); 
      
    } catch (error) {
      console.error("Booking error:", error);
      alert(`Σφάλμα: ${error.message}`);
      setOpenConfirmDialog(false);
    }
  }

  const handleTicketsChange = (ticket_type_id, quantity) => {
    setSelectedTickets(prev => ({
      ...prev,
      [ticket_type_id]: quantity
    }));
  }

  const availabilityColor = (available, total) => {
    if (available === 0) return '#d32f2f';
    if (available <= (total * 0.2)) return '#ed6c02';
    return '#4caf50';
  }

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

  if (loading || !fullEvent) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const latitude = fullEvent?.latitude ? parseFloat(fullEvent.latitude) : 37.9838;
  const longitude = fullEvent?.longitude ? parseFloat(fullEvent.longitude) : 23.7275; 
  const position = [latitude, longitude];

  const grandtotal = fullEvent.ticket_types ? fullEvent.ticket_types.reduce((total, ticket) => {
    const selectedQuantity = selectedTickets[ticket.ticket_type_id] || 0;
    return total + (selectedQuantity * ticket.price);
  }, 0) : 0;

  const eventDateObj = new Date(fullEvent.start_datetime);
  const formattedDate = !isNaN(eventDateObj) ? eventDateObj.toLocaleString('el-GR', { 
    dateStyle: 'short', timeStyle: 'short' 
  }) : '';

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
              <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#e3f2fd', color: '#1976d2', borderRadius: 2, fontSize: '4rem', fontWeight: 'bold' }}>
                {fullEvent.title ? fullEvent.title.charAt(0).toUpperCase() : 'E'}
              </Avatar>
                
              <Box>
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{fullEvent.title}</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{fullEvent.venue}</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{fullEvent.address}, {fullEvent.city}</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{formattedDate}</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 4, flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Περιγραφή Εκδήλωσης: </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>{fullEvent.description}</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', width: { xs: '100%', md: '400px' } }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Τοποθεσία Εκδήλωσης:</Typography>
              <Box sx={{ height: '200px', width: '400px', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={position} icon={customIcon}>
                    <Popup>
                      {fullEvent.title} <br /> {fullEvent.address}, {fullEvent.city}
                    </Popup>
                  </Marker>
                </MapContainer>
              </Box> 
            </Box>
          </Box>
          <Box sx={{ width: '100%', mt: 6, pt: 4, borderTop: '1px solid #eee' }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Εισιτήρια:</Typography>
            
            {fullEvent.ticket_types && fullEvent.ticket_types.length > 0 ? (
              <Grid container spacing={3}>
                {fullEvent.ticket_types.map((ticket) => (
                  <Grid item xs={12} sm={6} md={4} key={ticket.ticket_type_id}>
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
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" fontWeight="bold">{ticket.name}</Typography>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: '#1976d2', mt: 1, mb: 1 }}>{ticket.price}€</Typography>
                        
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          sx={{ color: ticket.available > 0 ? 'success.main' : 'error.main' }}
                        >
                          {ticket.available === 0 && (
                            <Typography variant="body2" color="error.main" fontWeight="bold">Sold Out</Typography>
                          )}
                           {/* {ticket.available === 0 ? "Sold Out" : `${ticket.available} διαθέσιμα`} */}
                        </Typography>
                      </Box>

                      {/* <Box sx={{ mt: 3, width: '100%', display: 'flex', alignItems: 'center' }}> */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1}}>
                          <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mb: 1 }}>Ποσότητα: </Typography>
                            <Select
                              value={selectedTickets[ticket.ticket_type_id] || 0}
                              onChange={(e) => handleTicketsChange(ticket.ticket_type_id, e.target.value)}
                              // sx={{ mt: 2, mb: 2, minWidth: '40%' }}
                              sx={{ minWidth: '70px', height: '35px' }}
                              disabled={ticket.available === 0}
                            >
                              {/* {[...Array(Math.min(11, ticket.available + 1)).keys()].map(num => (
                                <MenuItem key={num} value={num}>{num}</MenuItem>
                              ))} */}
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
                        {/* </Box> */}
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ mt: 1 }}>Σύνολο: {(selectedTickets[ticket.ticket_type_id] || 0) * ticket.price}€</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">Δεν υπάρχουν διαθέσιμα εισιτήρια αυτή τη στιγμή.</Typography>
              )}
          </Box>
            <Typography variant="h5" sx={{ alignSelf: 'center' }}> Σύνολο: {grandtotal}€</Typography>
            <Button variant="contained" sx={{ ...buttonStyle, borderRadius: 1, alignSelf: 'center' }} onClick={handleBooking} disabled={grandtotal === 0}>
              ΚΡΑΤΗΣΗ ΕΙΣΙΤΗΡΙΩΝ
            </Button>
            
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
              <DialogTitle>Επιβεβαίωση Κράτησης</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Είστε σίγουροι ότι θέλετε να προχωρήσετε με την κράτηση των επιλεγμένων εισιτηρίων;
                  Συνολικό Κόστος: <b>{grandtotal}</b>€
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