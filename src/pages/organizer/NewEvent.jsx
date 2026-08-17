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
import { styled } from "@mui/material/styles";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import AppTheme from "../../shared-theme/AppTheme";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

export default function CreateEvent() {
  const navigate = useNavigate();

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
  const [country, setCoountry] = React.useState("");
  const [countryError, setCountryError] = React.useState(false);
  const [countryErrorMessage, setCountryErrorMessage] = React.useState('');
  const [description, setDescription] = React.useState("");
  const [descriptionError, setDescriptionError] = React.useState(false);
  const [descriptionErrorMessage, setDescriptionErrorMessage] = React.useState('');
  const [capacity, setCapacity] = React.useState("");
  const [capacityError, setCapacityError] = React.useState(false);
  const [capacityErrorMessage, setCapacityErrorMessage] = React.useState('');
  // const [price, setPrice] = React.useState("");
  // const [priceError, setPriceError] = React.useState(false);
  // const [priceErrorMessage, setPriceErrorMessage] = React.useState('');
  // const [quantity, setQuantity] = React.useState("");
  // const [quantityError, setQuantityError] = React.useState(false);
  // const [quantityErrorMessage, setQuantityErrorMessage] = React.useState('');
  // const [ticketType, setTicketType] = React.useState("");
  // const [ticketTypeError, setTicketTypeError] = React.useState(false);
  // const [ticketTypeErrorMessage, setTicketTypeErrorMessage] = React.useState('');
  const [position, setPosition] = React.useState({ lat: 37.97601, lng: 23.72750 }); // For map marker position
  // const [position, setPosition] = React.useState('');




  const [tickets, setTickets] = React.useState([
    { type: '', price: '', quantity: '' } // Starts with one empty ticket form
  ]);
  const [ticketsError, setTicketsError] = React.useState(false);
  const [ticketsErrorMessage, setTicketsErrorMessage] = React.useState('');

  // Helper 1: Add a new blank ticket to the list
  const handleAddTicket = () => {
    setTickets([...tickets, { type: '', price: '', quantity: '' }]);
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

    // 1. Validate Title directly from state
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

    // 2. Validate Venue
    if (!venue || venue.length < 1){
      setVenueError(true);
      setVenueErrorMessage('Ο Χώρος Διεξαγωγής είναι υποχρεωτικός.');
      isValid = false;
    } else {
      setVenueError(false);
      setVenueErrorMessage('');
    }

    // 3. Validate City
    if (!city || city.length < 1){
      setCityError(true);
      setCityErrorMessage('Η Πόλη είναι υποχρεωτική.');
      isValid = false;
    } else {
      setCityError(false);
      setCityErrorMessage('');
    }

    // 4. Validate Address
    if (!address || address.length < 1){
      setAddressError(true);
      setAddressErrorMessage('Η Διεύθυνση είναι υποχρεωτική.');
      isValid = false;
    } else {
      setAddressError(false);
      setAddressErrorMessage('');
    }

    // 5. Validate Country
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

    // 6. Validate Description
    if (!description || description.length < 1){
      setDescriptionError(true);
      setDescriptionErrorMessage('Η Περιγραφή είναι υποχρεωτική.');
      isValid = false;
    } else {
      setDescriptionError(false);
      setDescriptionErrorMessage('');
    }

    // 7. Validate Capacity
    if (!capacity || capacity.length < 1){
      setCapacityError(true);
      setCapacityErrorMessage('Η Χωρητικότητα είναι υποχρεωτική.');
      isValid = false;
    } else {
      setCapacityError(false);
      setCapacityErrorMessage('');
    }

    // 8. Validate Price
    // if (!price || price.length < 1){  
    //   setPriceError(true);
    //   setPriceErrorMessage('Η Τιμή είναι υποχρεωτική.');
    //   isValid = false;
    // } else {
    //   setPriceError(false);
    //   setPriceErrorMessage('');
    // }

    // // 9. Validate Quantity
    // if (!quantity || quantity.length < 1){
    //   setQuantityError(true);
    //   setQuantityErrorMessage('Η Ποσότητα είναι υποχρεωτική.');
    //   isValid = false;
    // } else {
    //   setQuantityError(false);
    //   setQuantityErrorMessage('');
    // }

    // // 10. Validate Ticket Type
    // if (!ticketType || ticketType.length < 1){
    //   setTicketTypeError(true);
    //   setTicketTypeErrorMessage('Ο Τύπος Εισιτηρίου είναι υποχρεωτικός.');
    //   isValid = false;
    // } else {
    //   setTicketTypeError(false);
    //   setTicketTypeErrorMessage('');
    // }




    // Validate Tickets Array
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
    if (!isValid) {
      return;
    }

    // If everything is valid, proceed with saving!
    // try {
    //   console.log("Saving new event:", {
    //     title, category, date, startTime, endTime, venue, city, country, address, description, capacity, ticketType, price, quantity,
    //     latitude: position.lat, longitude: position.lng
    //   });



    try {
      console.log("Saving new event:", {
        title, category, date, startTime, endTime, venue, city, country, address, description, capacity, tickets,
        latitude: position.lat, longitude: position.lng
      });






      
      alert("Η εκδήλωση δημιουργήθηκε επιτυχώς!");
      navigate("/owner/OwnerDashboard");
      
    } catch (err) {
      console.error(err);
      alert("Σφάλμα κατά την αποθήκευση της εκδήλωσης.");
    }
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <EditContainer direction="column" justifyContent="flex-start">
        <Card variant="outlined" sx={{ 
            backgroundColor: 'white',
            borderColor: '#ddd'
          }}>
          <Typography component="h1" variant="h4">
            Δημιουργία Νέας Εκδήλωσης
          </Typography>

          <Box
            component="form"
            onSubmit={handleSave}
            noValidate
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
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

            {/* Row 3: Venue and City */}
            

            {/* Row 5: Description */}
            <FormControl fullWidth>
              <FormLabel htmlFor="description">Περιγραφή</FormLabel>
              <TextField 
                id="description" 
                fullWidth 
                multiline
                // rows={4}
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

            {/* <FormControl fullWidth>
              <FormLabel htmlFor="ticketType">Τύπος Εισιτηρίου</FormLabel>
              <TextField 
                id="ticketType" 
                fullWidth 
                value={ticketType} 
                onChange={(e) => setTicketType(e.target.value)} 
                placeholder=" "
                error={ticketTypeError}
                helperText={ticketTypeErrorMessage}
              />
            </FormControl> */}

            {/* Row 6: Ticket Info */}
            {/* <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <FormLabel htmlFor="price">Τιμή Εισιτηρίου (€)</FormLabel>
                <TextField
                  id="price"
                  type="number"
                  fullWidth
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="π.χ. 15"
                  error={priceError}
                  helperText={priceErrorMessage}
                />
              </FormControl>

              <FormControl fullWidth>
                <FormLabel htmlFor="quantity">Συνολικά Εισιτήρια</FormLabel>
                <TextField
                  id="quantity"
                  type="number"
                  fullWidth
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="π.χ. 1500"
                  error={quantityError}
                  helperText={quantityErrorMessage}
                />
              </FormControl>
            </Stack> */}






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
              <Button type="submit" variant="contained" size="large">
                Δημιουργια Εκδηλωσης
              </Button>

              <Button
                type="button"
                variant="outlined"
                onClick={() => navigate("/owner/OwnerDashboard")}
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