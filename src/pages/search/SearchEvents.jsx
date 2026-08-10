import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  TextField, Checkbox, FormControlLabel, Radio, RadioGroup, 
  Rating, Avatar, InputAdornment, Divider, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Slider from '@mui/material/Slider';

const getWeekKey = (dateObj) => {
  const d = new Date(dateObj);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dayStr = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};


// This magically removes Greek accents (e.g., "Αθήνα" -> "αθηνα")
const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};



export default function EventSearchPage(props) {
  const navigate = useNavigate(); 
  const { user } = useAuth();

  const [events, setEvents] = useState([]);

  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    time: ''
  });

  const handleAreaChange = (area) => {
    setSelectedAreas((prev) => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };


  // get data
  useEffect(() => {
    // Fake Event Data to test the UI
    const dummyEvents = [
      {
        id: 1,
        title: "Νίκος Οικονομόπουλος",
        category: "Μουσική",
        eventType: "Συναυλία",
        venue: "Θέατρο Πόλης",
        address: "Αριστοτέλους 15",
        city: "Αθήνα",
        country: "Ελλάδα",
        geoLocation: { latitude: "37.9838", longitude: "23.7275" },
        startDateTime: "2024-09-15T20:00:00",
        endDateTime: "2024-09-15T23:00:00",
        capacity: 800,
        price: 25,
        ticketTypes: [
          {
            ticketTypeID: 1,
            name: "Γενική Είσοδος",
            price: 15,
            quantity: 1500,
            available: 1500,
          },
          {
            ticketTypeID: 2,
            name: "VIP",
            price: 50,
            quantity: 500,
            available: 500,
          },
          {
            ticketTypeID: 3,
            name: "Φοιτητικό",
            price: 10,
            quantity: 300,
            available: 3,
          },
          {
            ticketTypeID: 4,
            name: "Οικογενειακό",
            price: 40,
            quantity: 200,
            available: 0,
          }
        ],
        bookings: [
          {
            bookingID: 1,
            attendeeID: 1,
            time:"2024-09-13T20:00:00",
            ticketType: 1,
            numberOfTickets: 2,
            totalCost: 30,
            bookingStatus: "confirmed"
          }
        ],
        organizerID: 1,
        status: "published",
        description: "Ο Νίκος Οικονομόπουλος είναι ένας από τους πιο δημοφιλείς Έλληνες τραγουδιστές, γνωστός για τις επιτυχίες του στον χώρο της λαϊκής μουσικής. Με μια καριέρα που ξεκίνησε από τα πρώτα του βήματα σε μουσικά σχήματα και συνεχίστηκε με πολυάριθμες συναυλίες και δίσκους, ο Οικονομόπουλος έχει καταφέρει να κερδίσει την αγάπη του κοινού με τη μοναδική φωνή και το πάθος του για τη μουσική.",
        media: [
          {
            photo: "colorday_cover.jpg"
          }
        ]
      },
      {
        id: 2,
        title: "Color Day",
        category: "Μουσική",
        eventType: "Φεστιβαλ",
        venue: "ΟΑΚΑ",
        address: "Μαρουσι",
        city: "Αθήνα",
        country: "Ελλάδα",
        geoLocation: { latitude: "37.9838", longitude: "23.7275" },
        startDateTime: "2024-09-15T20:00:00",
        endDateTime: "2024-09-15T23:00:00",
        capacity: 2000,
        ticketTypes: [
          {
            ticketTypeID: 1,
            name: "Γενική Είσοδος",
            price: 15,
            quantity: 1500,
            available: 1500,
          },
          {
            ticketTypeID: 2,
            name: "VIP",
            price: 50,
            quantity: 500,
            available: 500,
          }
        ],
        bookings: [
          {
            bookingID: 1,
            attendeeID: 1,
            time:"2024-09-13T20:00:00",
            ticketType: 1,
            numberOfTickets: 2,
            totalCost: 30,
            bookingStatus: "confiermed"
          }
        ],
        organizerID: 1,
        status: "published",
        description: "Το Color Day Festival είναι ένα από τα μεγαλύτερα μουσικά φεστιβάλ στην Ελλάδα, γνωστό για την εντυπωσιακή του ατμόσφαιρα και την ποικιλία των καλλιτεχνών που συμμετέχουν. Με χιλιάδες επισκέπτες κάθε χρόνο, το φεστιβάλ προσφέρει μια μοναδική εμπειρία γεμάτη μουσική, χρώματα και διασκέδαση.",
        media: [
          {
            photo: "colorday_cover.jpg"
          }
        ]
      },
      {
        id: 3,
        title: "Bloody Hawk",
        category: "Μουσική",
        eventType: "Συναυλία",
        venue: "Θέατρο Λυκαβηττού",
        address: "Λυκαβηττός",
        city: "Αθήνα",
        country: "Ελλάδα",
        geoLocation: { latitude: "37.9838", longitude: "23.7275" },
        startDateTime: "2024-09-15T20:00:00",
        endDateTime: "2024-09-15T23:00:00",
        capacity: 1000,
        price: 12,ticketTypes: [
          {
            ticketTypeID: 1,
            name: "Γενική Είσοδος",
            price: 15,
            quantity: 1500,
            available: 1500,
          },
          {
            ticketTypeID: 2,
            name: "VIP",
            price: 50,
            quantity: 500,
            available: 500,
          }
        ],
        bookings: [
          {
            bookingID: 1,
            attendeeID: 1,
            time:"2024-09-13T20:00:00",
            ticketType: 1,
            numberOfTickets: 2,
            totalCost: 30,
            bookingStatus: "confiermed"
          }
        ],
        organizerID: 1,
        status: "published",
        description: "Το Bloody Hawk είναι ένα από τα πιο δημοφιλή μουσικά οργανώματα στην Ελλάδα, γνωστό για την εντυπωσιακή του ατμόσφαιρα και την ποικιλία των καλλιτεχνών που συμμετέχουν.",
        media: [
          {
            photo: "colorday_cover.jpg"
          }
        ]
      },
      {
        id: 4,
        title: "Ο Τυχαίος Θάνατος Ενός Αναρχικού",
        category: "Θεατρο",
        eventType: "Θεατρική παράσταση",
        venue: "Θέατρο Πόλης",
        address: "Αριστοτέλους 15",
        city: "Θεσσαλονίκη",
        country: "Ελλάδα",
        geoLocation: { latitude: "37.9838", longitude: "23.7275" },
        startDateTime: "2024-09-15T20:00:00",
        endDateTime: "2024-09-15T23:00:00",
        capacity: 800,
        price: 20,ticketTypes: [
          {
            ticketTypeID: 1,
            name: "Γενική Είσοδος",
            price: 18,
            quantity: 1500,
            available: 1500,
          },
          {
            ticketTypeID: 2,
            name: "VIP",
            price: 50,
            quantity: 500,
            available: 500,
          }
        ],
        bookings: [
          {
            bookingID: 1,
            attendeeID: 1,
            time:"2024-09-13T20:00:00",
            ticketType: 1,
            numberOfTickets: 2,
            totalCost: 30,
            bookingStatus: "confiermed"
          }
        ],
        organizerID: 1,
        status: "published",
        description: "Η παράσταση 'Ο Τυχαίος Θάνατος Ενός Αναρχικού' είναι ένα από τα πιο γνωστά έργα του Ιταλού θεατρικού συγγραφέα Ντάριο Φο. Το έργο εξετάζει θέματα κοινωνικής δικαιοσύνης, πολιτικής διαφθοράς και ανθρώπινης ηθικής μέσα από μια έντονη και συχνά σατιρική προσέγγιση.",
        media: [
          {
            photo: "colorday_cover.jpg"
          }
        ]
      },
      {
        id: 5,
        title: "Amelie Lens",
        category: "Μουσική",
        eventType: "DJ Set",
        venue: "Cozmo",
        address: "Λεωφόρος Συγγρού 100",
        city: "Πάτρα",
        country: "Ελλάδα",
        geoLocation: { latitude: "37.9838", longitude: "23.7275" },
        startDateTime: "2024-09-15T20:00:00",
        endDateTime: "2024-09-15T23:00:00",
        capacity: 800,
        price: 45,ticketTypes: [
          {
            ticketTypeID: 1,
            name: "Γενική Είσοδος",
            price: 20,
            quantity: 1500,
            available: 1500,
          },
          {
            ticketTypeID: 2,
            name: "VIP",
            price: 50,
            quantity: 500,
            available: 500,
          }
        ],
        bookings: [
          {
            bookingID: 1,
            attendeeID: 1,
            time:"2024-09-13T20:00:00",
            ticketType: 1,
            numberOfTickets: 2,
            totalCost: 30,
            bookingStatus: "confiermed"
          }
        ],
        organizerID: 1,
        status: "published",
        description: "Η Amelie Lens είναι μια από τις πιο αναγνωρισμένες DJs και παραγωγούς στον κόσμο της ηλεκτρονικής μουσικής, γνωστή για τα δυναμικά της set και την ικανότητά της να δημιουργεί μοναδική ατμόσφαιρα σε κάθε εμφάνισή της. Με διεθνή καριέρα και συμμετοχές σε μεγάλα φεστιβάλ, η Lens έχει κερδίσει την εκτίμηση του κοινού και των κριτικών.",
        media: [
          {
            photo: "colorday_cover.jpg"
          }
        ]
      }
    ];

    setEvents(dummyEvents);
  }, []); // Empty dependency array ensures this only runs once when the page loads


  const [priceRange, setPriceRange] = useState([0, 100]);

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const filteredEvents = events.filter((event) => {
    const safeSearch = removeAccents(searchTerm).trim();
    const safeArea = removeAccents(searchArea).trim();

    const matchesSearch = removeAccents(event.category).includes(safeSearch) || removeAccents(event.title).includes(safeSearch);

    const startingPrice = event.ticketTypes?.length > 0 
      ? Math.min(...event.ticketTypes.map(ticket => ticket.price)) 
      : 0;
    const matchesPrice = startingPrice >= priceRange[0] && startingPrice <= priceRange[1];

    const searchAreaText = searchArea.trim().toLowerCase();
    const matchesAreaText = searchAreaText !== '' && (event.city.toLowerCase().includes(searchAreaText) || event.address.toLowerCase().includes(searchAreaText));
    const matchesArea = (selectedAreas.length === 0 && searchAreaText === '') || selectedAreas.includes(event.city) || matchesAreaText;
    
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes('Όλες') || selectedCategories.includes(event.category);    //anti gia category mporo na balo genre gia ta eidh

    return matchesSearch && matchesPrice && matchesArea && matchesCategory;
  });


// const startingPrice = Math.min(...event.ticketTypes.map(ticket => ticket.price));


  const buttonStyle = {
    background: 'linear-gradient(to bottom, #2f94f8ff, #0f4d8aff) !important',
    borderRadius: 5,
    px: 3, py: 1,
    fontWeight: 'bold', color: 'white',
    border: '1px solid #1976d2',
    boxShadow: '0 3px 5px 2px rgba(53, 77, 162, 0.3)',
    textTransform: 'none',
  };

  const inputStyle = {
    '& .MuiOutlinedInput-root': { bgcolor: '#ecebebff', borderRadius: 1, height: '35px' },
    '& .MuiInputBase-input': { p: 1 }
  };

  return (
    <AppTheme {...props}>
      <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
        <Box 
          sx={{ 
            flex: 1, 
            bgcolor: 'background.default', 
            color: 'text.primary', 
            p: { xs: 2, md: 4 }, 
            overflowY: 'auto'
          }}
        >
        
          <Grid container spacing={4} justifyContent={!user ? 'center' : 'flex-start'}>
            


            {/* filters */}
            <Grid item xs={12} md={3} sx={{ minWidth: 0 }}> {/* minWidth: 0 strictly forces the Grid not to stretch */}
              <Box sx={{ 
                bgcolor: 'white', 
                p: 3, 
                borderRadius: 2, 
                boxShadow: 1, 
                width: '100%', 
                maxWidth: '100%', // Locks the width
                boxSizing: 'border-box', // MAGIC RULE: Forces padding to stay INSIDE the box, stopping the stretch!
                overflow: 'hidden' 
              }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Φίλτρα:</Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography fontWeight="bold" sx={{ mb: 1, fontSize: '0.9rem' }}>Περιοχή:</Typography>
                  {['Αθήνα', 'Θεσσαλονίκη', 'Πάτρα', 'Λάρισα'].map((area) => (
                      <FormControlLabel 
                      key={area} 
                      control={<Checkbox size="small" checked={selectedAreas.includes(area)} onChange={() => handleAreaChange(area)} />} 
                      label={<Typography variant="body2">{area}</Typography>} 
                      labelPlacement="end" 
                      /* DELETED width: 100% so it stops pushing the walls */
                      sx={{ mb: 0.5, display: 'flex' }} 
                      />
                  ))}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <TextField 
                    placeholder="Αναζήτηση περιοχής..." 
                    variant="outlined"
                    value={searchArea}
                    onChange={(e) => setSearchArea(e.target.value)}
                    sx={{ width: '200px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' } }}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>) }}
                  />
                </Box>
                </Box>
                
                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 3 }}>
                  <Typography fontWeight="bold" sx={{ mb: 1, fontSize: '0.9rem' }}>Ημερομηνία:</Typography>
                  {['Οποτεδήποτε', 'Σήμερα', 'Αύριο', 'Αυτή την εβδομάδα', 'Συγκεκριμένο διάστημα', 'ελευθερη εισαγωγη'].map((area) => (
                      <FormControlLabel 
                      key={area} 
                      control={<Checkbox size="small"  />} 
                      label={<Typography variant="body2">{area}</Typography>} 
                      labelPlacement="end" 
                      sx={{ mb: 0.5, display: 'flex' }} 
                      />
                  ))}
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ mb: 3 }}>
                  <Typography fontWeight="bold" sx={{ mb: 1, fontSize: '0.9rem' }}>Είδος / Κατηγορία:</Typography>
                  {['Όλες', 'Λαϊκά', 'Έντεχνα', 'Pop', 'Rap', 'Techno'].map((category) => (
                      <FormControlLabel 
                      key={category} 
                      control={<Checkbox size="small" checked={selectedCategories.includes(category)} onChange={() => handleCategoryChange(category)} />} 
                      label={<Typography variant="body2">{category}</Typography>} 
                      labelPlacement="end" 
                      sx={{ mb: 0.5, display: 'flex' }} 
                      />
                  ))}
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <TextField 
                    placeholder="Αναζήτηση είδους..." 
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: '200px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' } }}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>) }}
                  />
                </Box>
                  
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ width: '100%', borderRadius: 1, boxSizing: 'border-box' }}>
                  <Typography gutterBottom fontWeight="bold" color="text.primary" sx={{ fontSize: '0.9rem' }}>
                    Τιμή Εισιτηρίου: {priceRange[0]}€ - {priceRange[1]}€+
                  </Typography>
                  
                  <Box sx={{ px: 2 }}>
                    <Slider
                      value={priceRange}
                      onChange={handlePriceChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={100} 
                      sx={{
                        color: '#5ba7fb',
                        '& .MuiSlider-thumb': {
                          '&:hover, &.Mui-focusVisible': {
                            boxShadow: '0px 0px 0px 8px rgb(91 167 251 / 16%)',
                          },
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>


            {/* results */}
            <Grid item xs={12} md={9}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight="bold">Κτηνίατροι:</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <TextField 
                    placeholder="Αναζήτηση εκδήλωσης, χώρου, κατηγορίας..." 
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: { xs: '100%', sm: '500px' }, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' } }}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>) }}
                  />
                  
                  
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Βρέθηκαν {filteredEvents.length} αποτελέσματα
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {

                    const startingPrice = event.ticketTypes?.length > 0 ? Math.min(...event.ticketTypes.map(ticket => ticket.price)) : 0;
                    return(
                      <Card key={event.id} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'white', display: 'flex', width: '100%', flexShrink: 0, boxSizing: 'border-box', boxShadow: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                        <CardContent sx={{ display: 'flex', width: '100%', p: 3, gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                          
                          <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
                            <PersonIcon sx={{ fontSize: 80, color: 'white' }} />
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>
                              {event.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                              {event.startDateTime}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                              {event.address}, {event.city}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                              Εισιτήρια από: {startingPrice}€
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: '220px' }}>
                            
                            {/* login for guests if they want to book an appointment */}
                            <Button 
                              sx={{ ...buttonStyle, width: '100%', borderRadius: 1 }}
                              onClick={() => {
                                  navigate('/search/BookTickets', { state: { event: event } });
                              }}
                            >
                              ΚΛΕΙΣΤΕ ΕΙΣΙΤΗΡΙΑ
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                  );
                })
                ) : (
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                     <Typography variant="h6" color="text.secondary">Δεν βρέθηκαν διοργανώσεις με αυτά τα κριτήρια.</Typography>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </AppTheme>
  );
}