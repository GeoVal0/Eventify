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
import { getMyEvents, publishEvent } from '../../api';

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
    const fetchEventData = async () => {
      setLoading(true);
      try {
        const data = await getMyEvents();
        setEvents(data.items || data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, []);

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'Δημοσιευμένη';
      case 'DRAFT': return 'Προσωρινά Αποθηκευμένη';
      case 'CANCELLED': return 'Ακυρωμένη';
      default: return status ? status.toUpperCase() : 'Αγνωστη';
    }
  };

  const hasValidLocation = (pos) => {
    return event && event.latitude && event.longitude;
  };

  // --- ACTIONS ---
  const handleCancelBooking = async (eventId) => {
    if(!window.confirm("Είστε σίγουροι ότι θέλετε να ακυρώσετε την κράτησή σας;")) return;
    // Add your API logic here
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'cancelled' } : e));
  };

  const handlePublish = async (eventId) => {
      if (!window.confirm("ση"))
        return;
  
      try {
        await publishEvent(eventId);
  
        setEvents(prev => prev.map(e => 
        e.event_id === eventId ? { ...e, status: 'PUBLISHED' } : e
      ));
      
      alert("Η εκδήλωση δημοσιεύτηκε επιτυχώς!");
    } catch (error) {
      console.error("Error publishing event:", error);
      alert("Υπήρξε σφάλμα κατά τη δημοσίευση.");
    
      }
    }

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
                    <Box 
                      onClick={() => navigate('/organizer/ViewEvent', { state: { eventId: event.event_id } })}
                      sx={{
                        display: 'flex',
                        flex: 1,
                        flexDirection: {xs: 'column', sm: 'row'},
                        cursor: 'pointer',
                        '&:hover': {opacity: 0.7, bgcolor: '#fafafa'}
                      }}
                      >
                    
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
                      {hasValidLocation(event) ? (
                         <MapContainer center={[event.latitude, event.longitude]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%', zIndex: 1 }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={[event.latitude, event.longitude]} icon={customIcon} />
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
                         Ημερομηνία: {event.start_datetime ? event.start_datetime.split('T')[0] : 'Άγνωστη'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                         Ώρα: {event.start_datetimetime ? event.start_datetime.split('T')[1].substring(0,5) : 'Άγνωστη'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                         Αριθμός Κρατήσεων: {event.ticketsBought}
                      </Typography>

                      <Typography 
                        variant="body2" 
                        fontWeight="bold" 
                        sx={{ 
                          mt: 2, 
                          color: event.status === 'PUBLISHED' ? 'primary.main' : event.status === 'DRAFT' ? 'warning.main' : 'error.main' 
                        }}
                      >
                        ΚΑΤΑΣΤΑΣΗ: {getStatusLabel(event.status)}
                      </Typography>
                    </Box>
                  </Box>

                    {/* Right Side: Action Buttons (Preserved layout styles) */}
                    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: '200px', alignItems: 'center' }}>

                      {(event.status === 'PUBLISHED') && (
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
                          onClick={() => navigate('/organizer/ViewEvent', { state: { eventId: event.event_id } })}
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
                                onClick={() => navigate('/organizer/EditEvent', { state: { eventId: event.event_id } })}
                              >
                              ΤΡΟΠΟΠΟΙΗΣΗ ΕΚΔΗΛΩΣΗΣ
                              </Button>
                          </>
                        
                      )}
                      
                      {(event.status === 'DRAFT') && (
                          <>
                              <Button 
                                variant="contained" fullWidth
                                sx={{ 
                                  background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
                                  borderRadius: 5,
                                  fontWeight: 'bold', 
                                  color: 'white',
                                  border: '1px solid #2e7d32',
                                  boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                                }}
                                onClick={() => handlePublish(event.event_id)}
                              >
                              ΔΗΜΟΣΙΕΥΣΗ ΕΚΔΗΛΩΣΗΣ
                              </Button> 

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
                                onClick={() => navigate('/organizer/ViewEvent', { state: { eventId: event.event_id } })}
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
                                onClick={() => navigate('/organizer/EditEvent', { state: { eventId: event.event_id } })}
                              >
                              ΤΡΟΠΟΠΟΙΗΣΗ ΕΚΔΗΛΩΣΗΣ
                              </Button>
                          </>
                      )}

                      {event.status === 'CANCELLED' && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                            onClick={() => navigate('/organizer/ViewEvent', { state: { eventId: event.id } })}
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
        </Box>
      </Box>
    </AppTheme>
  );
}