import React, { useState, useEffect} from 'react';
import {Box, Typography, Button, Avatar, Card, CardContent, Divider} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import {useLocation, useNavigate} from 'react-router-dom';
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {getEventDetail, getEventBookings, cancelEvent, deleteEvent, notifyCancellation} from '../../api';

// setup map icon
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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

export default function ViewEvent(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const eventId = location.state?.eventId;
  const [event, setEvent] = useState('null');
  const [bookedUsers, setBookedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [openCancelDialog, setCancelOpenDialog] = React.useState(false);


  useEffect(() => {
    if (!eventId) {
      navigate('/organizer/EventHistory')
      return;
   }

   // fetches all info and bookings for the selected event
    const fetchData = async () => {
      try {
        const [eventData, bookingsData] = await Promise.all([
          getEventDetail(eventId),
          getEventBookings(eventId)
        ]);
        setEvent(eventData);
        setBookedUsers(bookingsData);
     } catch (error) {
        console.error("Error fetching data:", error);
        alert("Αδυναμία φόρτωσης εκδήλωσης.");
        navigate('/organizer/EventHistory');
     } finally {
        setLoading(false);
     }
   };
    fetchData();
 }, [eventId, navigate]);

 // helpers

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PUBLISHED': return 'ΔΗΜΟΣΙΕΥΜΕΝΗ';
      case 'DRAFT': return 'ΠΡΟΣΩΡΙΝΑ ΑΠΟΘΗΚΕΥΜΕΝΗ';
      case 'CANCELLED': return 'ΑΚΥΡΩΜΕΝΗ';
      default: return status ? status.toUpperCase() : 'ΑΓΝΩΣΤΗ';
   }
 };

  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    if (isNaN(d)) return { date: 'Άγνωστο', time: ''};
    return {
      date: d.toLocaleDateString('el-GR'),
      time: d.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit'})
   };
 };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => setOpenDialog(false);
  const handleCancelOpenDialog = () => setCancelOpenDialog(true);
  const handleCancelCloseDialog = () => setCancelOpenDialog(false);

  const handlePublish = async () => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να δημοσιεύσετε αυτή την εκδήλωση;")) return;
    try {
      await publishEvent(eventId);
      setEvent({ ...event, status: 'PUBLISHED'});
      alert("Η εκδήλωση δημοσιεύτηκε επιτυχώς!");
   } catch (error) {
      console.error("Error publishing event:", error);
      alert("Υπήρξε σφάλμα κατά τη δημοσίευση.");
   }
 };

 // when an event gets cancelled, all the attendees are sent an informing messages
  const handleCancel = async () => {
    setCancelOpenDialog(false);
    try {
      await cancelEvent(event.event_id);
      const result = await notifyCancellation(event.event_id);
      alert(`Η εκδήλωση ακυρώθηκε επιτυχώς και ειδοποιήθηκαν ${result?.notified ?? 0} συμμετέχοντες.`);
      navigate('/organizer/EventHistory');
   } catch (error) {
      alert(`Σφάλμα κατά την ακύρωση: ${error.message}`);
   }
 }

  const handleDelete = async () => {
    setOpenDialog(false);
    try {
      await deleteEvent(event.event_id);
      alert("Η εκδήλωση διαγράφηκε επιτυχώς");
      navigate('/organizer/EventHistory');
   } catch (error) {
      alert(`Σφάλμα κατά τη διαγραφή: ${error.message}`);
   }
 }

  if (loading || !event) return <Typography>Φόρτωση...</Typography>;

  const { date, time} = formatDateTime(event.start_datetime);
  const mapPosition = { lat: event.latitude, lng: event.longitude};

  return (
    <AppTheme {...props}>
      <Box sx={{display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%'}}>
        
        <Box 
          sx={{
            flex: 1, 
            bgcolor: 'background.default', 
            p: { xs: 2, md: 4}, 
            display: 'flex', 
            justifyContent: 'center',
            overflowY: 'auto'
        }}
        >
          <Box sx={{width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: 4}}>
            
            <Typography variant="h5" fontWeight="bold" sx={{mb: -2}}>Λεπτομέρειες Εκδήλωσης</Typography>
            
            <Card variant="outlined" sx={{borderRadius: 4, bgcolor: 'white', border: '1px solid #c7c7c7', boxShadow: 'none', overflow: 'hidden'}}>
              <CardContent sx={{display: 'flex', flexDirection: { xs: 'column', md: 'row'}, p: 0}}>
                
                {/* photo */}
                <Box sx={{ 
                  width: { xs: '100%', md: '300px'},
                  height: 300,
                  bgcolor: '#e3f2fd', 
                  borderRight: {xs: 'none', md: '1px solid #eee'},
                  borderBottom: {xs: '1px solid #eee', md: 'none'},
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
                    sx={{width: '100%', height: '100%', borderRadius: 1, objectFit: 'cover', position: 'absolute', top: 0, left: 0}}
                  />
                </Box>

                <Box sx={{flex: 1, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                  <Box sx={{display: 'flex', flexDirection: { xs: 'column', sm: 'row'}, justifyContent: 'space-between', alignItems: 'flex-start'}}>
                    
                    {/* event info */}
                    <Box>
                      <Typography variant="h6" fontWeight="bold" sx={{mb: 1}}>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                        Χώρος: {event.venue}, {event.address}
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

                    {/* action buttons */}
                    <Box sx={{p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.5, minWidth: '220px', alignItems: 'center'}}>
                      
                      {/* DRAFT -> publish button */}
                      {event.status === 'DRAFT' && (
                        <Button 
                          variant="contained" fullWidth
                          sx={{
                            background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
                            borderRadius: 5, px: 4, py: 1.5, fontWeight: 'bold', color: 'white',
                            border: '1px solid #2e7d32', boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                            whiteSpace: 'nowrap'
                        }}
                          onClick={handlePublish}
                        >
                          ΔΗΜΟΣΙΕΥΣΗ ΕΚΔΗΛΩΣΗΣ
                        </Button>
                      )}

                      {/* NOT CANCELLED -> edit button */}
                      {event.status !== 'CANCELLED' && (
                        <Button 
                          variant="contained" fullWidth
                          sx={{
                            background: 'linear-gradient(to bottom, #8a8c8aff, #525151ff) !important',
                            borderRadius: 5, px: 4, py: 1.5, fontWeight: 'bold', color: 'white',
                            border: '1px solid #3e3e3eff', boxShadow: '0 3px 5px 2px rgba(47, 52, 47, 0.3)',
                            whiteSpace: 'nowrap'
                        }}
                          onClick={() => navigate('/organizer/EditEvent', { state: { eventId: event.event_id}})}
                        >
                          ΤΡΟΠΟΠΟΙΗΣΗ ΕΚΔΗΛΩΣΗΣ
                        </Button>
                      )}

                      {/* PUBLISHED -> cancel event button */}
                      {event.status === 'PUBLISHED' && (
                        <Button 
                          variant="contained" fullWidth
                          sx={{
                            background: 'linear-gradient(to bottom, #ff8848, #dd4d00) !important',
                            borderRadius: 5, px: 4, py: 1.5, fontWeight: 'bold', color: 'white',
                            border: '1px solid #e65100', boxShadow: '0 3px 5px 2px rgba(230, 81, 0, 0.3)',
                            whiteSpace: 'nowrap'
                        }}
                          onClick={handleCancelOpenDialog}
                        >
                          ΑΚΥΡΩΣΗ ΕΚΔΗΛΩΣΗΣ
                        </Button>
                      )}

                      {/* DRAFT OR NO BOOKINGS -> delete event button */}
                      {(event.status === 'DRAFT' || bookedUsers.length === 0) && (
                      <Button 
                        variant="contained" fullWidth
                        onClick={handleOpenDialog}
                        sx={{
                          background: 'linear-gradient(to bottom, rgb(245, 55, 74), rgb(129, 39, 39)) !important',
                          borderRadius: 5, px: 4, py: 1.5, fontWeight: 'bold', color: 'white',
                          border: '1px solid #c50c0c', boxShadow: '0 3px 5px 2px rgba(230, 0, 0, 0.3)',
                          boxShadow: '0 3px 5px 2px rgba(129, 39, 39, .3)', whiteSpace: 'nowrap'
                      }}
                      >
                        ΔΙΑΓΡΑΦΗ ΕΚΔΗΛΩΣΗΣ
                      </Button>
                      )}
                    </Box>

                  </Box>

                  <Divider sx={{my: 2}} />

                  {/* total tickets */}
                  <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">ΣΥΝΟΛΙΚΕΣ ΚΡΑΤΗΣΕΙΣ</Typography>
                      <Typography variant="h5" fontWeight="bold" color="primary.main">{event.total_booked} Εισιτήρια</Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

              {/* description and map */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', width: '100%', mt: 4, flexDirection: { xs: 'column', md: 'row'}, gap: 4}}>
                        <Box sx={{flex: 1}}>
                          <Typography variant="h6" sx={{mb: 2}}>Περιγραφή Εκδήλωσης: </Typography>
                          <Typography variant="body1" sx={{color: 'text.secondary', fontSize: '1.1rem'}}>{event.description}</Typography>
                        </Box>
            
                        <Box sx={{display: 'flex', flexDirection: 'column', width: { xs: '100%', md: '400px'}}}>
                          <Typography variant="h6" sx={{mb: 2}}>Τοποθεσία Εκδήλωσης:</Typography>
                          <Box sx={{height: '200px', width: '400px', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd'}}>
                            <MapContainer center={[mapPosition.lat, mapPosition.lng]} zoom={15} scrollWheelZoom={false} style={{height: '100%', width: '100%'}}>
                              <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              />
                              <Marker position={[mapPosition.lat, mapPosition.lng]} icon={customIcon}>
                                <Popup>
                                  {event.title} <br /> {event.address}, {event.city}
                                </Popup>
                              </Marker>
                            </MapContainer>
                          </Box> 
                        </Box>
                      </Box>

            {/* photo album, only if 1< photos */}
          {event.photos && event.photos.length > 1 && (
            <Box sx={{width: '100%'}}>
              <Typography variant="h6" sx={{mb: 2}}>Συλλογή Φωτογραφιών:</Typography>
              <Box 
                sx={{
                  display: 'flex', 
                  gap: 2, 
                  overflowX: 'auto', 
                  pb: 2,
                  '&::-webkit-scrollbar': { height: '8px'}, 
                  '&::-webkit-scrollbar-thumb': { bgcolor: '#c1c1c1', borderRadius: '4px'} 
                }}
              >
                {event.photos.map((photo, index) => (
                  <Box
                    key={photo.id || index}
                    component="img"
                    src={`http://localhost:8000/static/uploads/${photo.filename || photo}`}
                    alt={`${event.title} - photo ${index + 1}`}
                    sx={{
                      width: 220,
                      height: 150,
                      objectFit: 'cover',
                      borderRadius: 2,
                      boxShadow: 1,
                      flexShrink: 0,
                      '&:hover': {transform: 'scale(1.02)', transition: '0.2s'}
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

            {/* booked users list */}
            <Typography variant="h5" fontWeight="bold" sx={{mt: 2, mb: -2}}>
               Λίστα Κρατήσεων ({bookedUsers.length})
            </Typography>

            <Box sx={{display: 'flex', flexDirection: 'column', gap: 2}}>
              {bookedUsers.length > 0 ? (
                bookedUsers.map((bookedUser) => (
                  <Card 
                    key={bookedUser.booking_id} 
                    variant="outlined" 
                    sx={{
                      borderRadius: 3, bgcolor: 'white', border: '1px solid #e0e0e0', 
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', p: 2,
                      flexDirection: { xs: 'column', sm: 'row'}, gap: 2
                  }}
                  >
                  <CardContent sx={{flex: 1, width: '100%', display: 'flex', flexDirection: { xs: 'column', sm: 'row'}, alignItems: 'center', p: 3, gap: 3}}>
                    <Avatar variant="rounded" sx={{width: 90, height: 90, bgcolor: '#5ba7fb', borderRadius: 2}}>
                      <PersonIcon sx={{fontSize: 60, color: 'white'}} />
                    </Avatar>
                    <Box sx={{flex: 1}}>
                      <Typography variant="h6" fontWeight="bold" sx={{color: 'black'}}>
                        {bookedUser.attendee_username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ονοματεπώνυμο: {bookedUser.attendee_first_name} {bookedUser.attendee_last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Διεύθυνση: {bookedUser.attendee_address || 'Διεύθυνση -'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Email: {bookedUser.attendee_email}
                      </Typography>
                    </Box>
                  </CardContent>

                    {/* tickets info */}
                    <Box sx={{textAlign: { xs: 'center', sm: 'right'}, borderLeft: { xs: 'none', sm: '1px solid #eee'}, pl: { xs: 0, sm: 3}}}>
                      <Typography variant="caption" color="text.secondary" display="block">ΚΑΤΗΓΟΡΙΑ: {bookedUser.ticket_type_name}</Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        {bookedUser.number_of_tickets} {bookedUser.number_of_tickets === 1 ? 'Εισιτήριο' : 'Εισιτήρια'}
                      </Typography>
                    </Box>

                    {/* action button */}
                    <Box sx={{ml: { xs: 0, sm: 2}}}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        sx={{borderRadius: 5, fontWeight: 'bold'}}
                        onClick={() => navigate('/messages', {
                          state: {
                            prefillEventId: bookedUser.event_id,
                            prefillAttendeeId: bookedUser.attendee_id,
                         }
                       })}
                      >
                        ΜΗΝΥΜΑ
                      </Button>
                    </Box>
                  </Card>
                ))
              ) : (
                <Typography textAlign="center" color="text.secondary" sx={{mt: 4, py: 6, bgcolor: 'white', borderRadius: 4, border: '1px dashed #ccc'}}>
                  Δεν υπάρχουν ακόμα κρατήσεις για αυτή την εκδήλωση.
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* pop up windows */}
      <Dialog
        open={openCancelDialog}
        onClose={handleCancelCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        sx={{'& .MuiDialog-paper': { bgcolor: 'white'}}}
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
        sx={{'& .MuiDialog-paper': { bgcolor: 'white'}}}
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

//////////otan patao diagrafi se ena event diagrafetai entelos