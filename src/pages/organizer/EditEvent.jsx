import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import MuiCard from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import { styled } from "@mui/material/styles";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AppTheme from "../../shared-theme/AppTheme";
import Alert from "@mui/material/Alert";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getEventDetail, updateEvent } from "../../api";


const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng); // Updates the coordinates when the map is clicked
    },
  });
  return position === null ? null : (
    <Marker position={position} icon={customIcon}></Marker>
  );
}

// Preserved exactly from your original layout layout[cite: 3]
const Card = styled(MuiCard)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignSelf: "center",
  width: "100%",
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: "auto",
  [theme.breakpoints.up("sm")]: { width: "700px" },
}));

// Preserved exactly from your original layout[cite: 3]
const EditContainer = styled(Stack)(({ theme }) => ({
  minHeight: "100dvh",
  padding: theme.spacing(2),
  [theme.breakpoints.up("sm")]: { padding: theme.spacing(4) },
  overflowY: "auto",
  position: "relative",
  "&::before": {
    content: '""',
    display: "block",
    position: "absolute",
    zIndex: -1,
    inset: 0,
    backgroundColor: theme.palette.background.default,
  },
}));

export default function EditEvent() {
  const navigate = useNavigate();
  // const {eventID} = useParams(); // Get the event ID from the URL
  const location = useLocation();
  const eventId = location.state?.eventId;
  const [apiError, setApiError] = React.useState(''); // For showing backend errors
  const [loading, setLoading] = React.useState(true);

  // Event Form States
  const [title, setTitle] = React.useState("");
  const [titleError, setTitleError] = React.useState(false);
  const [titleErrorMessage, setTitleErrorMessage] = React.useState('');
  const [category, setCategory] = React.useState("");
  const [categoryError, setCategoryError] = React.useState(false);
  const [categoryErrorMessage, setCategoryErrorMessage] = React.useState('');
  const [eventType, setEventType] = React.useState("");
  const [eventTypeError, setEventTypeError] = React.useState(false);
  const [eventTypeErrorMessage, setEventTypeErrorMessage] = React.useState('');
  const [map, setMap] = React.useState(null);
  const [mapError, setMapError] = React.useState(false);
  const [mapErrorMessage, setMapErrorMessage] = React.useState('');
  const [date, setDate] = React.useState("");
  const [dateError, setDateError] = React.useState(false);
  const [dateErrorMessage, setDateErrorMessage] = React.useState('');
  const [startTime, setStartTime] = React.useState("");
  const [startTimeError, setStartTimeError] = React.useState(false);
  const [startTimeErrorMessage, setStartTimeErrorMessage] = React.useState('');
  const [endTime, setEndTime] = React.useState("");
  const [endTimeError, setEndTimeError] = React.useState(false);
  const [endTimeErrorMessage, setEndTimeErrorMessage] = React.useState('');
  const [venue, setVenue] = React.useState("");
  const [venueError, setVenueError] = React.useState(false);
  const [venueErrorMessage, setVenueErrorMessage] = React.useState('');
  const [city, setCity] = React.useState("");
  const [cityError, setCityError] = React.useState(false);
  const [cityErrorMessage, setCityErrorMessage] = React.useState('');
  const [address, setAddress] = React.useState("");
  const [addressError, setAddressError] = React.useState(false);
  const [addressErrorMessage, setAddressErrorMessage] = React.useState('');
  const [country, setCountry] = React.useState("");
  const [countryError, setCountryError] = React.useState(false);
  const [countryErrorMessage, setCountryErrorMessage] = React.useState('');
  const [description, setDescription] = React.useState("");
  const [descriptionError, setDescriptionError] = React.useState(false);
  const [descriptionErrorMessage, setDescriptionErrorMessage] = React.useState('');
  const [capacity, setCapacity] = React.useState("");
  const [capacityError, setCapacityError] = React.useState(false);
  const [capacityErrorMessage, setCapacityErrorMessage] = React.useState('');
  const [position, setPosition] = React.useState({ lat: 37.97601, lng: 23.72750 }); // For map marker position
  // const [tickets, setTickets] = React.useState([{ type: '', price: '', quantity: '' }]);    //starts from one empty ticket form
  const [tickets, setTickets] = React.useState([]);
  const [ticketsError, setTicketsError] = React.useState(false);
  const [ticketsErrorMessage, setTicketsErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (!eventId){
      navigate('/organizer/EventHistory');
      return;
    }

    const fetchEventData = async () => {
      try {
        const data = await getEventDetail(eventId);

        setTitle(data.title);
        setCategory(data.categories?.[0] || ""); // Backend uses an array, UI uses a string
        setEventType(data.event_type);
        setVenue(data.venue);
        setCity(data.city);
        setAddress(data.address);
        setCountry(data.country);
        setDescription(data.description);
        setCapacity(data.capacity?.toString() || "");
        
        if (data.latitude && data.longitude) {
            setPosition({ lat: data.latitude, lng: data.longitude });
        }

        // Split "YYYY-MM-DDTHH:MM:SS" into date and time fields
        if (data.start_datetime) {
            const [d, t] = data.start_datetime.split('T');
            setDate(d);
            setStartTime(t.substring(0, 5)); // Get just HH:MM
        }
        if (data.end_datetime) {
            const t = data.end_datetime.split('T')[1];
            if(t) setEndTime(t.substring(0, 5));
        }

        if (data.ticket_types && data.ticket_types.length > 0) {
            setTickets(data.ticket_types.map(t => ({
                // id: t.ticket_type_id || t.id, 
                id: t.ticket_type_id ?? t.id ?? null,
                type: t.name,
                price: t.price?.toString() || "",
                quantity: t.quantity?.toString() || ""
            })));
        } else {
            setTickets([{ id: null, type: '', price: '', quantity: '' }]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Failed to load event data:", err);
        alert("Αδυναμία φόρτωσης εκδήλωσης.");
        navigate("/organizer/EventHistory");
      }
    };

    fetchEventData();
}, [eventId, navigate]);

  // Helper 1: Add a new blank ticket to the list
  const handleAddTicket = () => {
    setTickets([...tickets, { id: null, type: '', price: '', quantity: '' }]);
  };

  // Helper 2: Remove a specific ticket from the list
  const handleRemoveTicket = (index) => {
    const newTickets = tickets.filter((_, i) => i !== index);
    setTickets(newTickets);
  };

  // Helper 3: Update a specific field inside a specific ticket
  const handleTicketChange = (index, field, value) => {
    const newTickets = [...tickets];
    newTickets[index][field] = value;
    setTickets(newTickets);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    let isValid = true;

    // ERROR MESSAGES FOR ALL FIELDS WHEN EMPTY
    if (!title || title.length < 1){
      setTitleError(true);
      setTitleErrorMessage('Ο Τίτλος είναι υποχρεωτικός.');
      isValid = false;
    } else {
      setTitleError(false);
      setTitleErrorMessage('');
    }

    if (!category || category.length < 1){
      setCategoryError(true);
      setCategoryErrorMessage('Η Κατηγορία είναι υποχρεωτική.');
      isValid = false;
    } else {
      setCategoryError(false);
      setCategoryErrorMessage('');
    }

    if (!eventType || eventType.length < 1){
      setEventTypeError(true);
      setEventTypeErrorMessage('Ο Τύπος Εκδήλωσης είναι υποχρεωτικός.');
      isValid = false;
    } else {
      setEventTypeError(false);
      setEventTypeErrorMessage('');
    }

    if (!venue || venue.length < 1){
      setVenueError(true);
      setVenueErrorMessage('Ο Χώρος Διεξαγωγής είναι υποχρεωτικός.');
      isValid = false;
    } else {
      setVenueError(false);
      setVenueErrorMessage('');
    }

    if (!city || city.length < 1){
      setCityError(true);
      setCityErrorMessage('Η Πόλη είναι υποχρεωτική.');
      isValid = false;
    } else {
      setCityError(false);
      setCityErrorMessage('');
    }

    if (!address || address.length < 1){
      setAddressError(true);
      setAddressErrorMessage('Η Διεύθυνση είναι υποχρεωτική.');
      isValid = false;
    } else {
      setAddressError(false);
      setAddressErrorMessage('');
    }

    if (!country || country.length < 1){
      setCountryError(true);
      setCountryErrorMessage('Η Χώρα είναι υποχρεωτική.');
      isValid = false;
    } else {
      setCountryError(false);
      setCountryErrorMessage('');
    }

    if (!date || date.length < 1){
      setDateError(true);
      setDateErrorMessage('Η Ημερομηνία είναι υποχρεωτική.');
      isValid = false;
    } else {
      setDateError(false);
      setDateErrorMessage('');
    }

    if (!startTime || startTime.length < 1){
      setStartTimeError(true);
      setStartTimeErrorMessage('Η Ώρα Έναρξης είναι υποχρεωτική.');
      isValid = false;
    } else {
      setStartTimeError(false);
      setStartTimeErrorMessage('');
    }

    if (!endTime || endTime.length < 1){
      setEndTimeError(true);
      setEndTimeErrorMessage('Η Ώρα Λήξης είναι υποχρεωτική.');
      isValid = false;
    } else {
      setEndTimeError(false);
      setEndTimeErrorMessage('');
    }

    if (!description || description.length < 1){
      setDescriptionError(true);
      setDescriptionErrorMessage('Η Περιγραφή είναι υποχρεωτική.');
      isValid = false;
    } else {
      setDescriptionError(false);
      setDescriptionErrorMessage('');
    }

    if (!capacity || capacity.length < 1){
      setCapacityError(true);
      setCapacityErrorMessage('Η Χωρητικότητα είναι υποχρεωτική.');
      isValid = false;
    } else {
      setCapacityError(false);
      setCapacityErrorMessage('');
    }

    let hasTicketError = false;
    if (tickets.length === 0) {
      hasTicketError = true;
    } else {
      tickets.forEach(ticket => {
        if (!ticket.type || !ticket.price || !ticket.quantity) {
          hasTicketError = true;
        }
      });
    }

    if (hasTicketError) {
      setTicketsError(true);
      setTicketsErrorMessage('Τα πεδία των Εισιτηρίων είναι υποχρεωτικά.');
      isValid = false;
    } else {
      setTicketsError(false);
      setTicketsErrorMessage('');
    }

    // If any validation failed, STOP here. Do not save.
    if (!isValid)
      return;
    
    const payload = {
      title: title,
      event_type: eventType,
      categories: [category], 
      venue: venue,
      city: city,
      address: address,
      country: country,
      latitude: position.lat,
      longitude: position.lng,
      start_datetime: `${date}T${startTime}:00`, 
      // end_datetime: `${date}T${endTime}:00`,
      end_datetime: endTime ? `${date}T${endTime}:00` : null,
      capacity: parseInt(capacity, 10),
      description: description,
      ticket_types: tickets.map(t => {
        const baseTicket = {
          name: t.type,
          price: parseFloat(t.price),
          quantity: parseInt(t.quantity, 10)
        };
        // if (t.id) baseTicket.ticket_type_id = t.id;
        if (t.id !== null && t.id !== undefined && t.id !== "") {
    baseTicket.ticket_type_id = t.id;
}
        return baseTicket;
        // id: t.ticket_type_id,
        // name: t.type, 
        // price: parseFloat(t.price),
        // quantity: parseInt(t.quantity, 10)
      })
    };

    console.log("SENDING PAYLOAD:", payload);

    try {
      setApiError(''); // Reset errors
      await updateEvent(eventId, payload);
      
      alert("Οι αλλαγές αποθηκεύτηκαν επιτυχώς!");
      navigate("/organizer/EventHistory"); 
      
    } catch (err) {
      console.error(err);
      setApiError(err.message); // Show backend validation errors on screen
    }
  };

  if (loading) {
    return (
      <AppTheme>
        <CssBaseline enableColorScheme />
        <EditContainer direction="column" justifyContent="center" alignItems="center">
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Φόρτωση Δεδομένων...</Typography>
        </EditContainer>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <EditContainer direction="column" justifyContent="flex-start">
        <Card variant="outlined" sx={{ 
            backgroundColor: 'white',
            borderColor: '#ddd'
          }}>
          <Typography component="h1" variant="h4">
            Επεξεργασία Εκδήλωσης
          </Typography>

          <Box
            component="form"
            onSubmit={handleSave}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            {apiError && (
              <Alert severity="error" sx={{ mb: 2}}>
                {apiError}
              </Alert>
            )}
            {/* Row 1: Title and Category */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <FormLabel htmlFor="title">Τίτλος Εκδήλωσης</FormLabel>
                <TextField 
                  id="title" 
                  fullWidth 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="π.χ. Συναυλία Ρέμος"
                  error={titleError}
                  helperText={titleErrorMessage}
                />
              </FormControl>

              <FormControl fullWidth error={categoryError}>
                <FormLabel htmlFor="category">Κατηγορία</FormLabel>
                <Select
                  displayEmpty
                  required
                  fullWidth
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  variant="outlined"
                  error={categoryError}
                  helperText={categoryErrorMessage}
                >
                  <MenuItem value="music">Μουσική</MenuItem>
                  <MenuItem value="theater">Θέατρο</MenuItem>
                  <MenuItem value="sports">Αθλητισμός</MenuItem>
                  <MenuItem value="festival">Φεστιβάλ</MenuItem>
                </Select>
                {categoryError && <FormHelperText>{categoryErrorMessage}</FormHelperText>}
              </FormControl>

              <FormControl fullWidth error={eventTypeError}>
                <FormLabel htmlFor="eventType">Τύπος Εκδήλωσης</FormLabel>
                <Select
                  displayEmpty
                  required
                  fullWidth
                  id="eventType"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  error={eventTypeError}
                  helperText={eventTypeErrorMessage}
                >
                  <MenuItem value="music">Συναυλία</MenuItem>
                  <MenuItem value="theater">Θεατρική Παράσταση</MenuItem>
                  <MenuItem value="festival">Φεστιβάλ</MenuItem>
                  <MenuItem value="seminar">Σεμινάριο</MenuItem>
                  <MenuItem value="festival">Ημερίδα</MenuItem>
                </Select>
                {eventTypeError && <FormHelperText>{eventTypeErrorMessage}</FormHelperText>}
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <FormLabel htmlFor="venue">Χώρος Διεξαγωγής</FormLabel>
                <TextField 
                  id="venue" 
                  fullWidth 
                  value={venue} 
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="π.χ. OAKA" 
                  error={venueError}
                  helperText={venueErrorMessage}
                />
              </FormControl>
            </Stack>

            {/* Row 4: Full Address */}
            <FormControl fullWidth>
              <FormLabel htmlFor="address">Διεύθυνση</FormLabel>
              <TextField 
                id="address" 
                fullWidth 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                placeholder="π.χ. Λεωφόρος Σπύρου Λούη 1"
                error={addressError}
                helperText={addressErrorMessage}
              />
            </FormControl>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                    <FormLabel htmlFor="city">Πόλη</FormLabel>
                    <TextField 
                        id="city" 
                        fullWidth 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="π.χ. Μαρούσι" 
                        error={cityError}
                        helperText={cityErrorMessage}
                    />
                </FormControl>

                <FormControl fullWidth>
                  <FormLabel htmlFor="country">Χώρα</FormLabel>
                  <TextField 
                      id="country" 
                      fullWidth 
                      value={country} 
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="π.χ. Ελλάδα" 
                      error={countryError}
                      helperText={countryErrorMessage}
                  />
                </FormControl>
            </Stack>

            <FormControl fullWidth>
              <FormLabel>Επιλογή Τοποθεσίας στον Χάρτη</FormLabel>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                Κάντε κλικ στον χάρτη για να αποθηκεύσετε την ακριβή τοποθεσία της εκδήλωσης.
              </Typography>
              <Box sx={{ height: '300px', width: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #ccc', mb: 2 }}>
                <MapContainer center={[37.9838, 23.7275]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationMarker position={position} setPosition={setPosition} />
                </MapContainer>
              </Box>
              {mapError && <FormHelperText error>{mapErrorMessage}</FormHelperText>}
              
              {/* Optional: Show the selected coordinates so the user knows it worked */}
              {/* <Stack direction="row" spacing={2}>
                <TextField label="Γεωγραφικό Πλάτος (Lat)" size="small" value={position.lat.toFixed(5)} disabled fullWidth />
                <TextField label="Γεωγραφικό Μήκος (Lng)" size="small" value={position.lng.toFixed(5)} disabled fullWidth />
              </Stack> */}
            </FormControl>

            {/* Row 2: Date and Time */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth required>
                <FormLabel htmlFor="date">Ημερομηνία</FormLabel>
                <TextField
                  id="date"
                  type="date"
                  fullWidth
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  error={dateError}
                  helperText={dateErrorMessage}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel htmlFor="startTime">Ώρα Έναρξης</FormLabel>
                <TextField
                  id="startTime"
                  type="time"
                  fullWidth
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  error={startTimeError}
                  helperText={startTimeErrorMessage}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel htmlFor="endTime">Ώρα Λήξης</FormLabel>
                <TextField
                  id="endTime"
                  type="time"
                  fullWidth
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  error={endTimeError}
                  helperText={endTimeErrorMessage}
                />
              </FormControl>
            </Stack>

            {/* Row 5: Description */}
            <FormControl fullWidth>
              <FormLabel htmlFor="description">Περιγραφή</FormLabel>
              <TextField 
                id="description" 
                fullWidth 
                multiline
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Περιγραφή εκδήλωσης"
                error={descriptionError}
                helperText={descriptionErrorMessage}
              />
            </FormControl>

            <FormControl fullWidth>
              <FormLabel htmlFor="capacity">Χωρητικότητα</FormLabel>
              <TextField 
                id="capacity" 
                fullWidth 
                value={capacity} 
                onChange={(e) => setCapacity(e.target.value)} 
                placeholder="π.χ. 5000"
                error={capacityError}
                helperText={capacityErrorMessage}
              />
            </FormControl>

            {/* --- DYNAMIC TICKETS SECTION --- */}
            <FormControl fullWidth error={ticketsError}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">Κατηγορίες Εισιτηρίων</Typography>
                <Button variant="outlined" size="small" onClick={handleAddTicket}>
                  + Προσθήκη νέας κατηγορίας εισιτηρίου
                </Button>
              </Box>

              {tickets.map((ticket, index) => (
                <Box key={index} sx={{ p: 2, mb: 2, border: '1px solid #ddd', borderRadius: 2, bgcolor: '#fafafa' }}>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Εισιτήριο #{index + 1}
                    </Typography>
                    {tickets.length > 1 && (
                      <Button color="error" size="small" onClick={() => handleRemoveTicket(index)}>
                        Αφαίρεση
                      </Button>
                    )}
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <FormLabel>Τύπος Εισιτηρίου</FormLabel>
                      <TextField 
                        fullWidth 
                        value={ticket.type} 
                        onChange={(e) => handleTicketChange(index, 'type', e.target.value)} 
                        placeholder="π.χ. VIP, Φοιτητικό"
                      />
                    </FormControl>

                    <FormControl fullWidth>
                      <FormLabel>Τιμή (€)</FormLabel>
                      <TextField
                        type="number"
                        fullWidth
                        value={ticket.price}
                        onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                        placeholder="π.χ. 15"
                      />
                    </FormControl>

                    <FormControl fullWidth>
                      <FormLabel>Ποσότητα</FormLabel>
                      <TextField
                        type="number"
                        fullWidth
                        value={ticket.quantity}
                        onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)}
                        placeholder="π.χ. 500"
                      />
                    </FormControl>
                  </Stack>
                </Box>
              ))}
              
              {/* Show error message if any ticket fields are blank */}
              {ticketsError && <FormHelperText >{ticketsErrorMessage}</FormHelperText>}
            </FormControl>

            {/* Action Buttons */}
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button type="submit" variant="contained" size="large" 
                sx={{ 
                  background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important',
                  fontWeight: 'bold', 
                  color: 'white',
                  border: '1px solid #2e7d32',
                  boxShadow: '0 3px 5px 2px rgba(46, 125, 50, .3)',
                }}>
                Αποθήκευση Αλλαγών
              </Button>

              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/organizer/EventHistory")}   //history or view?
              >
                Ακυρωση
              </Button>
            </Box>
          </Box>
        </Card>
      </EditContainer>
    </AppTheme>
  );
}