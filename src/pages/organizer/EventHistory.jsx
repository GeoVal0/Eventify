import React, { useState, useEffect } from 'react';
import {Box, Typography, Button, Card, CardContent, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import AppTheme from '../../shared-theme/AppTheme';
import {useAuth } from '../../context/AuthContext';
import {useNavigate } from 'react-router-dom';
import {getMyEvents, publishEvent } from '../../api';

const CATEGORY_IMAGES = {
  music: '/public/1061513-taylor-swift-en-concert-a-paris-la-defense-arena-on-y-etait-on-vous-raconte.jpg',
  theater: '/public/theater_01.jpg',
  cinema: '/public/aithousa-cine-opera.jpg_1.jpg',
  sports: '/public/depositphotos_690286156-stock-photo-set-sport-equipment-soccer-basketball.jpg',
  festival: '/public/ASFF-2024-11.jpg',
  seminar: '/public/what-is-a-seminar_standard.jpg',
  arts: '/public/6113d70d63ca0-What-is-Fine-Art--Eden-Gallery-.jpeg'
};

const getFallbackImage = (event) => {
  const matchedCategory = (event.categories || []).find(c => CATEGORY_IMAGES[c]);
  if (matchedCategory) return CATEGORY_IMAGES[matchedCategory];
};

export default function EventHistoryPage(props) {
  const navigate = useNavigate();
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest'); 
  const [statusFilter, setStatusFilter] = useState('all');

  // fetches all data for each event

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

  // helpers

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'ΔΗΜΟΣΙΕΥΜΕΝΗ';
      case 'DRAFT': return 'ΠΡΟΣΩΡΙΝΑ ΑΠΟΘΗΚΕΥΜΕΝΗ';
      case 'CANCELLED': return 'ΑΚΥΡΩΜΕΝΗ';
      default: return status ? status.toUpperCase() : 'Αγνωστη';
    }
  };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    if (isNaN(d)) return { date: 'Άγνωστο', time: '' };
    return {
      date: d.toLocaleDateString('el-GR'),
      time: d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // --- ACTIONS ---
  const handlePublish = async (eventId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να δημοσιεύσετε αυτή την εκδήλωση;")) return;
  
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
  };

  // filtering and sorting
  const filteredEvents = events
    .filter(e => {
      if (statusFilter === 'all') return true;
      return e.status === statusFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.start_datetime);
      const dateB = new Date(b.start_datetime);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  if (loading) return <Box sx={{display: 'flex', justifyContent: 'center', mt: 10}}><CircularProgress /></Box>;

  return (
    <AppTheme {...props}>
      <Box sx={{display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%'}}>
        
        <Box sx={{
            flex: 1, 
            bgcolor: 'background.default', 
            p: { xs: 2, md: 4 }, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            overflowY: 'auto' 
       }}>

          {/* filters */}
          <Box sx={{width: '100%', maxWidth: '900px', mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2}}>
            <Box sx={{display: 'flex', gap: 2}}>
              <FormControl size="small" sx={{minWidth: 200, bgcolor: 'white', borderRadius: 1}}>
                <InputLabel>Ταξινόμηση</InputLabel>
                <Select value={sortOrder} label="Ταξινόμηση" onChange={(e) => setSortOrder(e.target.value)}>
                  <MenuItem value="newest">Πιο πρόσφατες εκδηλώσεις</MenuItem>
                  <MenuItem value="oldest">Παλαιότερες εκδηλώσεις</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{minWidth: 200, bgcolor: 'white', borderRadius: 1}}>
                <InputLabel>Κατάσταση</InputLabel>
                <Select value={statusFilter} label="Κατάσταση" onChange={(e) => setStatusFilter(e.target.value)}>
                  <MenuItem value="all">Όλες</MenuItem>
                  <MenuItem value="PUBLISHED">Δημοσιευμένες</MenuItem>
                  <MenuItem value="DRAFT">Προσωρινά Αποθηκευμένες</MenuItem>
                  <MenuItem value="CANCELLED">Ακυρωμένες</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* event list */}
          <Box sx={{width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: 2}}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const { date, time } = formatDateTime(event.start_datetime);
                return (
                  <Card 
                    key={event.event_id || event.id} 
                    variant="outlined" 
                    sx={{borderRadius: 4, bgcolor: 'white', border: '1px solid #c7c7c7', boxShadow: 'none', overflow: 'hidden'}}
                  >
                  <CardContent sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, p: 0}}>
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
                    
                    {/* photo */}
                    <Box sx={{
                      width: { xs: '100%', sm: '200px' }, 
                      height: '200px',
                      borderRadius: 1,
                      bgcolor: '#e3f2fd', 
                      borderRight: { xs: 'none', sm: '1px solid #eee' },
                      borderBottom: { xs: '1px solid #eee', sm: 'none' },
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden'
                   }}>
                      <Box 
                        component="img"
                        src={
                          event.cover_photo 
                            ? `http://localhost:8000/static/uploads/${event.cover_photo}` 
                            : event.photos && event.photos.length > 0 
                              ? `http://localhost:8000/static/uploads/${event.photos[0].filename || event.photos[0]}`
                              : getFallbackImage(event)
                        }
                        alt={event.title}
                        sx={{
                          width: '100%', 
                          height: '100%',
                          objectFit: 'cover'
                       }}
                      />
                    </Box>

                    {/* event info */}
                    <Box sx={{flex: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                      <Typography variant="h6" fontWeight="bold" sx={{mb: 1}}>
                        {event.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                        Χώρος: {event.venue}, {event.address}, {event.city}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary">
                        Ημερομηνία: {date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ώρα: {time}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Αριθμός Κρατήσεων: {event.total_booked}
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

                    {/* action buttons */}
                    <Box sx={{p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, minWidth: '200px', alignItems: 'center'}}>

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
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
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
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
                );
              })
            ) : (
               <Typography textAlign="center" color="text.secondary" sx={{mt: 4}}>Δεν βρέθηκε ιστορικό εκδηλώσεων.</Typography>
            )}
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}