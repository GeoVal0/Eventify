import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, 
  Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions 
} from '@mui/material';
import LocationOffIcon from '@mui/icons-material/LocationOff'; 
import AppTheme from '../../shared-theme/AppTheme';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

export default function EventHistoryPage(props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [statusFilter, setStatusFilter] = useState('all');

  const [ticketDialogOpen, setTicketDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null); 

  useEffect(() => {
    // Mocking fetching data for Event History
    const fetchEventData = async () => {
      setLoading(true);
      try {
        // Replace with your actual backend fetch: await fetch(`http://localhost:3001/bookings?userId=${user.id}`);
        const mockData = [
          {
            id: 1,
            title: 'Συναυλία Νίκος Οικονομόπουλος',
            venue: 'OAKA',
            date: '2026-09-15',
            time: '21:00',
            status: 'published', // published, draft, cancelled
            ticketsBought: 2,
            position: { lat: 38.0371, lng: 23.7840 }
          },
          {
            id: 2,
            title: 'Φεστιβάλ Θερινού Κινηματογράφου',
            venue: 'Θησείο',
            date: '2026-07-10',
            time: '20:30',
            status: 'draft',
            ticketsBought: 0,
            position: { lat: 37.9754, lng: 23.7208 }
          },
          {
            id: 3,
            title: 'Ακυρωμένη Παράσταση',
            venue: 'Θέατρο Βράχων',
            date: '2026-08-01',
            time: '19:00',
            status: 'cancelled',
            ticketsBought: 4,
            position: null
          }
        ];
        
        // Simulating network delay
        setTimeout(() => {
          setEvents(mockData);
          setLoading(false);
        }, 800);

      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchEventData();
  }, [user]);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'published': return 'Δημοσιευμένη';
      case 'draft': return 'Προσωρινά Αποθηκευμένη';
      case 'cancelled': return 'Ακυρωμένη';
      default: return status ? status.toUpperCase() : 'Αγνωστη';
    }
  };

  const hasValidLocation = (pos) => {
    return pos && typeof pos.lat === 'number' && typeof pos.lng === 'number' && (pos.lat !== 0 || pos.lng !== 0);
  };

  // --- ACTIONS ---
  const handleCancelBooking = async (eventId) => {
    if(!window.confirm("Είστε σίγουροι ότι θέλετε να ακυρώσετε την κράτησή σας;")) return;
    // Add your API logic here
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e));
  };

  const handleViewTickets = (eventData) => {
    setSelectedEvent(eventData);
    setTicketDialogOpen(true);
  };

  const handleCloseTickets = () => {
    setTicketDialogOpen(false);
    setSelectedEvent(null);
  };

  // --- FILTERING & SORTING ---
  const filteredEvents = events
    .filter(e => {
      if (statusFilter === 'all') return true;
      return e.status === statusFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <AppTheme {...props}>
      <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
        
        {/* <SideMenu /> Placeholder if you have a side navigation */}

        <Box sx={{ 
            flex: 1, 
            bgcolor: 'background.default', 
            p: { xs: 2, md: 4 }, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            overflowY: 'auto' 
        }}>

          {/* Top Filters (Preserved exact layout) */}
          <Box sx={{ width: '100%', maxWidth: '900px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
                      <InputLabel>Ταξινόμηση</InputLabel>
                      <Select value={sortOrder} label="Ταξινόμηση" onChange={(e) => setSortOrder(e.target.value)}>
                          <MenuItem value="newest">Πιο πρόσφατες εκδηλώσεις</MenuItem>
                          <MenuItem value="oldest">Παλαιότερες εκδηλώσεις</MenuItem>
                      </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'white', borderRadius: 1 }}>
                      <InputLabel>Κατάσταση</InputLabel>
                      <Select value={statusFilter} label="Κατάσταση" onChange={(e) => setStatusFilter(e.target.value)}>
                          <MenuItem value="all">Όλες</MenuItem>
                          <MenuItem value="published">Δημοσιευμένες</MenuItem>
                          <MenuItem value="draft">Προσωρινά Αποθηκευμένες</MenuItem>
                          <MenuItem value="cancelled">Ακυρωμένες</MenuItem>
                      </Select>
                  </FormControl>
              </Box>
          </Box>

          {/* Event Cards List */}
          <Box sx={{ width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <Card 
                  key={event.id} 
                  variant="outlined" 
                  sx={{ borderRadius: 4, bgcolor: 'white', border: '1px solid #c7c7c7', boxShadow: 'none', overflow: 'hidden' }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, p: 0 }}>
                    
                    {/* Left Side: Map Block (Preserved layout) */}
                    <Box sx={{ 
                      width: { xs: '100%', sm: '250px' }, 
                      minHeight: '200px',
                      bgcolor: '#e3f2fd', 
                      borderRight: { xs: 'none', sm: '1px solid #eee' },
                      borderBottom: { xs: '1px solid #eee', sm: 'none' },
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {hasValidLocation(event.position) ? (
                         <MapContainer center={[event.position.lat, event.position.lng]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[event.position.lat, event.position.lng]} icon={customIcon} />
                         </MapContainer>
                      ) : (
                          <Box sx={{ textAlign: 'center', opacity: 0.6, p: 2 }}>
                              <LocationOffIcon sx={{ fontSize: 50, color: '#9e9e9e' }} />
                              <Typography variant="caption" display="block" color="text.secondary">
                                  Χωρίς Τοποθεσία
                              </Typography>
                          </Box>
                      )}
                    </Box>

                    {/* Middle: Event Info */}
                    <Box sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

                    {/* Right Side: Action Buttons (Preserved layout styles) */}
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: '200px', alignItems: 'center' }}>
                      
                      {event.status === 'published' && (
                          <>
                              <Button 
                                  variant="contained" fullWidth
                                  sx={{ 
                                    background: 'linear-gradient(to bottom, #2f94f8ff, #0f4d8aff) !important',
                                    borderRadius: 5, 
                                    px: 4, py: 1.5, 
                                    fontWeight: 'bold', 
                                    color: 'white',
                                    border: '1px solid #1976d2',
                                    boxShadow: '0 3px 5px 2px rgba(53, 77, 162, 0.3)',
                                  }}
                                  onClick={() => handleViewTickets(event)}
                              >
                                  ΠΡΟΒΟΛΗ ΕΚΔΗΛΩΣΗΣ
                              </Button>
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
                                  }}
                                  onClick={() => handleCancelBooking(event.id)}
                              >
                                  ΤΡΟΠΟΠΟΙΗΣΗ ΕΚΔΗΛΩΣΗΣ
                              </Button>
                          </>
                      )}

                      {event.status === 'draft' && (
                        <>
                        <Button 
                                  variant="contained" fullWidth
                                  sx={{ 
                                    background: 'linear-gradient(to bottom, #2f94f8ff, #0f4d8aff) !important',
                                    borderRadius: 5, 
                                    px: 4, py: 1.5, 
                                    fontWeight: 'bold', 
                                    color: 'white',
                                    border: '1px solid #1976d2',
                                    boxShadow: '0 3px 5px 2px rgba(53, 77, 162, 0.3)',
                                  }}
                                  onClick={() => handleViewTickets(event)}
                              >
                                  ΠΡΟΒΟΛΗ ΕΚΔΗΛΩΣΗΣ
                              </Button>

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
                                  }}
                                  onClick={() => handleCancelBooking(event.id)}
                              >
                                  ΤΡΟΠΟΠΟΙΗΣΗ ΕΚΔΗΛΩΣΗΣ
                              </Button>
                        


                           {/* <Button 
                              variant="contained" fullWidth
                              sx={{ 
                                background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
                                borderRadius: 5, 
                                px: 4, py: 1.5, 
                                fontWeight: 'bold', 
                                color: 'white',
                                border: '1px solid #2e7d32',
                                boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                              }}
                          >
                              ΔΗΜΟΣΙΕΥΣΗ ΕΚΔΗΛΩΣΗΣ
                          </Button>

                          <Button 
                              variant="contained" fullWidth
                              sx={{ 
                                background: 'linear-gradient(to bottom, rgb(245, 55, 74), rgb(129, 39, 39)) !important',
                                borderRadius: 5, 
                                px: 4, py: 1.5, 
                                fontWeight: 'bold', 
                                color: 'white',
                                border: '1px solid #2e7d32',
                                boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                              }}
                          >
                              ΔΙΑΓΡΑΦΗ ΕΚΔΗΛΩΣΗΣ
                          </Button> */}
                        </>
                      )}

                      {event.status === 'cancelled' && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {/* <Typography variant="h5" color="error.main" fontWeight="bold">✕</Typography>
                              <Typography variant="body2" color="error.main" fontWeight="bold">ΑΚΥΡΩΘΗΚΕ</Typography> */}
                              <Button 
                              variant="contained" fullWidth
                              sx={{ 
                                background: 'linear-gradient(to bottom, #2f94f8ff, #0f4d8aff) !important',
                                borderRadius: 5, 
                                px: 4, py: 1.5, 
                                fontWeight: 'bold', 
                                color: 'white',
                                border: '1px solid #1976d2',
                                boxShadow: '0 3px 5px 2px rgba(53, 77, 162, 0.3)',
                              }}
                          >
                              ΠΡΟΒΟΛΗ ΕΚΔΗΛΩΣΗΣ
                          </Button>
                          </Box>
                      )}
                    </Box>

                  </CardContent>
                </Card>
              ))
            ) : (
               <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>Δεν βρέθηκε ιστορικό εκδηλώσεων.</Typography>
            )}
          </Box>

          {/* Ticket Details Dialog (Repurposed from Edit Dialog) */}
          <Dialog 
            open={ticketDialogOpen} 
            onClose={handleCloseTickets} 
            maxWidth="sm" 
            fullWidth
            sx={{ '& .MuiDialog-paper': { bgcolor: '#ffffff' } }}
          >
            <DialogTitle fontWeight="bold" sx={{ bgcolor: 'white' }}>Τα Εισιτήριά σας</DialogTitle>
            <DialogContent dividers sx={{ bgcolor: 'white' }}>
              {selectedEvent && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1, textAlign: 'center' }}>
                   
                   <Typography variant="h6" fontWeight="bold">
                      {selectedEvent.title}
                   </Typography>
                   <Typography variant="body1" color="text.secondary">
                      {selectedEvent.venue} | {selectedEvent.date}
                   </Typography>

                   <Box sx={{ p: 4, bgcolor: '#f5f5f5', borderRadius: 2, border: '2px dashed #ccc' }}>
                      <Typography variant="h4" fontWeight="bold" sx={{ letterSpacing: 4 }}>
                         QR CODE HERE
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                         Αριθμός Εισιτηρίων: {selectedEvent.ticketsBought}
                      </Typography>
                   </Box>

                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, bgcolor: 'white' }}>
              <Button onClick={handleCloseTickets} variant="contained" color="primary">ΚΛΕΙΣΙΜΟ</Button>
            </DialogActions>
          </Dialog>

        </Box>
      </Box>
    </AppTheme>
  );
}