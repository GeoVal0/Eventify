import React, { useState, useEffect } from 'react';
import {Box, Typography, Button, Grid, Card, CardContent, TextField, Checkbox, FormControlLabel, Avatar, InputAdornment, Divider} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AppTheme from '../../shared-theme/AppTheme';
import {useNavigate, useLocation } from 'react-router-dom';
import {useAuth } from '../../context/AuthContext';
import Slider from '@mui/material/Slider';
import {getEvents } from '../../api'; 

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

const removeAccents = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

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

export default function EventSearchPage(props) {
  const navigate = useNavigate(); 
  const location = useLocation();
  const { user } = useAuth();

  // 1. Instantly read the URL parameter on load
  const searchParams = new URLSearchParams(location.search);
  // const initialCategory = searchParams.get('category') || searchParams.get('categories');

  const [events, setEvents] = useState([]);
  
  // Filter States
  const [selectedAreas, setSelectedAreas] = useState([]);
  // const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get('category') ? [searchParams.get('category')] : 
    (searchParams.get('categories') ? [searchParams.get('categories')] : [])
  );
  const [selectedDateFilter, setSelectedDateFilter] = useState('Οποτεδήποτε');
  
  const [exactSearchDate, setExactSearchDate] = useState(searchParams.get('date') || '');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  
  // Search Text States
  const [searchTerm, setSearchTerm] = useState(searchParams.get('query') || '');
  const [searchArea, setSearchArea] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');


  // Keep filters synced if URL changes while already on the page
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('category') || params.get('categories');
    if (cat) {
      setSelectedCategories([cat]);
    }

    // Add this to catch the query string from Home.jsx
    const query = params.get('query');
    if (query) {
      setSearchTerm(query);

      setSelectedDateFilter(''); // Clear preset if URL provides exact date
    }
    
    // (Optional: If you also pass dates from Home, catch them here too)
    const dateQuery = params.get('date');
    if (dateQuery) {
      setExactSearchDate(dateQuery);
      setSelectedDateFilter(''); // Clear preset if URL provides exact date
    }
  }, [location.search]);

  const handleAreaChange = (area) => {
    setSelectedAreas((prev) => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const data = await getEvents(); 
        setEvents(data.items || data); 
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };
    fetchEventData();
  }, []); 

  // --- FILTERING LOGIC ---
  const filteredEvents = events.filter((event) => {
    const now = new Date();
    const eventDateObj = new Date(event.start_datetime || event.startDateTime);
    
    // 1. Hide Past Events
    if (isNaN(eventDateObj) || eventDateObj < now) {
      return false;
    }

    // 2. Date Filter
    // if (selectedDateFilter === 'Σήμερα') {
    //   if (eventDateObj.toDateString() !== now.toDateString()) return false;
    // } else if (selectedDateFilter === 'Αύριο') {
    //   const tomorrow = new Date(now);
    //   tomorrow.setDate(tomorrow.getDate() + 1);
    //   if (eventDateObj.toDateString() !== tomorrow.toDateString()) return false;
    // } else if (selectedDateFilter === 'Αυτή την εβδομάδα') {
    //   if (getWeekKey(eventDateObj) !== getWeekKey(now)) return false;
    // }
    // 2. Date Filter (Exact Date OR Preset)
    if (exactSearchDate) {
      const targetDate = new Date(exactSearchDate);
      if (eventDateObj.toDateString() !== targetDate.toDateString()) return false;
    } else {
      if (selectedDateFilter === 'Σήμερα') {
        if (eventDateObj.toDateString() !== now.toDateString()) return false;
      } else if (selectedDateFilter === 'Αύριο') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (eventDateObj.toDateString() !== tomorrow.toDateString()) return false;
      } else if (selectedDateFilter === 'Αυτή την εβδομάδα') {
        if (getWeekKey(eventDateObj) !== getWeekKey(now)) return false;
      }
    }

    // 3. Price Filter
    const startingPrice = event.min_price !== null && event.min_price !== undefined ? event.min_price : 0;
    if (startingPrice < priceRange[0] || startingPrice > priceRange[1]) return false;

    // 4. Area Filter
    const eventCity = event.city || '';
    const eventAddress = event.address || '';
    if (selectedAreas.length > 0 && !selectedAreas.includes(eventCity)) return false;
    
    const safeAreaSearch = removeAccents(searchArea).trim();
    if (safeAreaSearch !== '') {
      const safeCity = removeAccents(eventCity);
      const safeAddress = removeAccents(eventAddress);
      if (!safeCity.includes(safeAreaSearch) && !safeAddress.includes(safeAreaSearch)) return false;
    }

    // 5. Broad Category Filter (Translates UI Greek strings to Backend English/Greek strings)
    const eventCategories = Array.isArray(event.categories) ? event.categories.map(c => c.toLowerCase()) : [];
    const eventType = (event.event_type || '').toLowerCase();
    const allEventTags = [...eventCategories, eventType]; // Combine tags and types

    if (selectedCategories.length > 0 && !selectedCategories.includes('Όλες')) {
      const CATEGORY_MAP = {
        'Μουσική': ['music', 'μουσική', 'συναυλία', 'concert'],
        'Θέατρο': ['theater', 'theatre', 'θέατρο', 'θεατρική παράσταση'],
        'Σινεμά': ['cinema', 'σινεμά', 'ταινία', 'movie'],
        'Αθλητισμός': ['sports', 'αθλητισμός', 'αγώνας'],
        'Φεστιβάλ': ['festival', 'φεστιβάλ'],
        'Σεμινάρια': ['seminar', 'σεμινάριο', 'ημερίδα', 'συνέδριο', 'εκπαίδευση', 'workshop']
      };

      const hasMatchingCategory = selectedCategories.some(sc => {
        const possibleValues = CATEGORY_MAP[sc] || [sc.toLowerCase()];
        return possibleValues.some(pv => allEventTags.some(tag => tag.includes(pv)));
      });

      if (!hasMatchingCategory) return false;
    }
    
    // Search Category TextField
    const safeCatSearch = removeAccents(categorySearchTerm).trim();
    if (safeCatSearch !== '') {
      const matchesCatText = allEventTags.some(c => removeAccents(c).includes(safeCatSearch));
      if (!matchesCatText) return false;
    }

    // 6. Main Text Search
    const safeSearch = removeAccents(searchTerm).trim();
    if (safeSearch !== '') {
      // const eventTitle = event.title || '';
      // const eventVenue = event.venue || '';
      // const 
      const matchesMain = removeAccents(event.title).includes(safeSearch) || 
                          removeAccents(event.venue).includes(safeSearch) ||
                          removeAccents(event.city).includes(safeSearch) ||
                          removeAccents(event.address).includes(safeSearch) ||
                          removeAccents(event.description).includes(safeSearch) ||
                          removeAccents(event.category).includes(safeSearch) ||

                          allEventTags.some(c => removeAccents(c).includes(safeSearch));
      if (!matchesMain) return false;
    }

    return true;
  });

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
      <Box sx={{display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%'}}>
        <Box 
          sx={{
            flex: 1, 
            bgcolor: 'background.default', 
            color: 'text.primary', 
            p: { xs: 2, md: 4 }, 
            overflowY: 'auto'
         }}
        >
        
          <Grid container spacing={4} alignItems="flex-start" justifyContent={!user ? 'center' : 'flex-start'}>
            {/* FILTERS COLUMN */}
            <Grid item xs={12} md={6} sx={{minWidth: 0}}> 
              <Box sx={{
                bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 1, 
                width: '100%', boxSizing: 'border-box', overflow: 'hidden' 
             }}>
                <Typography variant="h6" fontWeight="bold" sx={{mb: 2}}>Φίλτρα:</Typography>

                <Box sx={{mb: 3}}>
                  <Typography fontWeight="bold" sx={{mb: 1, fontSize: '0.9rem'}}>Περιοχή:</Typography>
                  {['Αθήνα', 'Θεσσαλονίκη', 'Πάτρα', 'Λάρισα'].map((area) => (
                      <FormControlLabel 
                      key={area} 
                      control={<Checkbox size="small" checked={selectedAreas.includes(area)} onChange={() => handleAreaChange(area)} />} 
                      label={<Typography variant="body2">{area}</Typography>} 
                      labelPlacement="end" 
                      sx={{mb: 0.5, display: 'flex'}} 
                      />
                  ))}
                  <Box sx={{display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                  <TextField 
                    placeholder="Αναζήτηση περιοχής..." 
                    variant="outlined"
                    value={searchArea}
                    onChange={(e) => setSearchArea(e.target.value)}
                    sx={{width: '200px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 3, height: '40px' }}}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>)}}
                  />
                </Box>
              </Box>
                
              <Divider sx={{mb: 3}} />
                
              <Box sx={{mb: 3}}>
                <Typography fontWeight="bold" sx={{mb: 1, fontSize: '0.9rem'}}>Ημερομηνία:</Typography>
                  {['Οποτεδήποτε', 'Σήμερα', 'Αύριο', 'Αυτή την εβδομάδα'].map((dateOption) => (
                      <FormControlLabel 
                        key={dateOption} 
                        control={
                          <Checkbox 
                            size="small"  
                            checked={selectedDateFilter === dateOption && !exactSearchDate}
                            onChange={() => {
                              setSelectedDateFilter(dateOption);
                              setExactSearchDate(''); // Clear exact date if radio option is picked
                           }}
                          />
                        } 
                        label={<Typography variant="body2">{dateOption}</Typography>} 
                        labelPlacement="end" 
                        sx={{mb: 0.5, display: 'flex'}} 
                      />
                  ))}
                  {/* <Box sx={{mb: 3}}> */}
                  <Box sx={{display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                  <TextField
                    type="date"
                    size="small"
                    fullWidth
                    value={exactSearchDate}
                    onChange={(e) => {
                      setExactSearchDate(e.target.value);
                      setSelectedDateFilter(''); // Clear radio options if exact date is picked
                   }}
                    sx={{'& .MuiOutlinedInput-root': { borderRadius: 2 }}}
                  />
                </Box>
                </Box>

                <Divider sx={{mb: 3}} />

                <Box sx={{mb: 3}}>
                  <Typography fontWeight="bold" sx={{mb: 1, fontSize: '0.9rem'}}>Είδος / Κατηγορία:</Typography>
                  {['Όλες', 'Μουσική', 'Θέατρο', 'Σινεμά', 'Αθλητισμός', 'Φεστιβάλ', 'Σεμινάρια'].map((category) => (
                      <FormControlLabel 
                      key={category} 
                      control={<Checkbox size="small" checked={selectedCategories.includes(category)} onChange={() => handleCategoryChange(category)} />} 
                      label={<Typography variant="body2">{category}</Typography>} 
                      labelPlacement="end" 
                      sx={{mb: 0.5, display: 'flex'}} 
                      />
                  ))}
                  {/* <Box sx={{display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                    <TextField 
                      placeholder="Αναζήτηση είδους..." 
                      variant="outlined"
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
                      sx={{width: '200px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' }}}
                      InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>)}}
                    />
                  </Box>  */}
                </Box>

                <Divider sx={{mb: 3}} />

                {/* <Box sx={{width: '100%', borderRadius: 1, boxSizing: 'border-box'}}>
                  <Typography gutterBottom fontWeight="bold" color="text.primary" sx={{fontSize: '0.9rem'}}>
                    Τιμή Εισιτηρίου: {priceRange[0]}€ - {priceRange[1]}€+
                  </Typography>
                  
                  <Box sx={{px: 2}}>
                    <Slider
                      value={priceRange}
                      onChange={handlePriceChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={500} 
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
                </Box> */}

                <Box sx={{width: '100%', borderRadius: 1, boxSizing: 'border-box'}}>
                  <Typography gutterBottom fontWeight="bold" color="text.primary" sx={{fontSize: '0.9rem', mb: 2}}>
                    Τιμή Εισιτηρίου:
                  </Typography>

                  {/* Πεδία πληκτρολόγησης για ακριβή επιλογή */}
                  <Box sx={{display: 'flex', alignItems: 'center', gap: 2, mb: 1}}>
                    <TextField
                      size="small"
                      type="number"
                      label="Από (€)"
                      value={priceRange[0]}
                      onChange={(e) => handlePriceChange(null, [Number(e.target.value), priceRange[1]])}
                      inputProps={{ min: 0, max: 1000}}
                      sx={{width: '80px', '& .MuiOutlinedInput-root': { borderRadius: 2 }}}
                    />
                    <Typography color="text.secondary">-</Typography>
                    <TextField
                      size="small"
                      type="number"
                      label="Έως (€)"
                      value={priceRange[1]}
                      onChange={(e) => handlePriceChange(null, [priceRange[0], Number(e.target.value)])}
                      inputProps={{ min: 0, max: 1000}}
                      sx={{width: '80px', '& .MuiOutlinedInput-root': { borderRadius: 2 }}}
                    />
                  </Box>
                  
                  {/* Slider με βήμα 5€ για πιο εύκολη χρήση */}
                  <Box sx={{px: 2}}>
                    <Slider
                      value={priceRange}
                      onChange={handlePriceChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={500} 
                      // step={5} // Κουμπώνει ανά 5 ευρώ
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

            {/* RESULTS COLUMN */}
            <Grid item xs={12} md={6} sx={{flexGrow: 1}}>
              <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2}}>
                <Typography variant="h4" fontWeight="bold">Εκδηλώσεις:</Typography>
                <Box sx={{display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, flexWrap: 'wrap'}}>
                  <TextField 
                    placeholder="Αναζήτηση εκδήλωσης, χώρου, περιοχής..." 
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{width: { xs: '100%', sm: '500px' }, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' }}}
                    InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>)}}
                  />
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{mb: 3}}>
                Βρέθηκαν {filteredEvents.length} αποτελέσματα
              </Typography>

              <Box sx={{display: 'flex', flexDirection: 'column', gap: 3}}>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    const startingPrice = event.min_price !== null && event.min_price !== undefined ? event.min_price : 0;
                    
                    const eventDate = event.start_datetime || event.startDateTime;
                    const eventDateObj = new Date(eventDate);
                    const formattedDate = !isNaN(eventDateObj) ? eventDateObj.toLocaleDateString('el-GR') : 'Άγνωστη Ημερομηνία';
                    const formattedTime = !isNaN(eventDateObj) ? eventDateObj.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : '';

                    return(
                      <Card key={event.event_id || event.eventId} variant="outlined"
                        onClick={() => navigate('/search/BookTickets', {state: {event: event}})}
                        sx={{
                          borderRadius: 2, 
                          bgcolor: 'white', 
                          display: 'flex', 
                          width: '100%', 
                          flexShrink: 0, 
                          boxSizing: 'border-box', 
                          boxShadow: 1, 
                          transition: 'transform 0.2s, box-shadow 0.2s', // Ομαλό εφέ
                          cursor: 'pointer', // ΠΡΟΣΘΗΚΗ: Δείχνει το χεράκι
                          '&:hover': {
                            transform: 'scale(1.02)',
                            boxShadow: 4 // Μεγαλώνει ελαφρώς η σκιά για να φαίνεται ότι πατιέται
                          } 
                        }}
                        >
                        <CardContent sx={{display: 'flex', width: '100%', gap: 4, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }}}>

                          {/* Image display matching your backend static upload route */}
                          {/* <Box 
                            component="img"
                            src={
                              event.cover_photo 
                                ? `http://localhost:8000/static/uploads/${event.cover_photo}` 
                                : event.photos && event.photos.length > 0 
                                  ? `http://localhost:8000/static/uploads/${event.photos[0].filename || event.photos[0]}`
                                  : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=400&q=80'
                            }
                            alt={event.title}
                            sx={{
                              width: { xs: '100%', sm: 160 }, 
                              height: 160, 
                              objectFit: 'cover', 
                              borderRadius: 2,
                              bgcolor: '#5ba7fb' 
                           }}
                          /> */}

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
                            // onClick={() => navigate('/search/BookTickets', {state: {event: event}})}
                            sx={{
                              width: { xs: '100%', sm: 200 }, 
                              height: 170, 
                              objectFit: 'cover', 
                              borderRadius: 2,
                              bgcolor: '#5ba7fb',
                              // cursor: 'pointer', // Δείχνει το χεράκι όταν περνάει το ποντίκι
                              // '&:hover': {opacity: 0.8 } // Εφέ hover 
                           }}
                          />

                          <Box sx={{flex: 1}}>
                            
                            <Typography variant="h6" fontWeight="bold" sx={{color: 'black'}}>
                              {event.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{mt: 1, mb: 1}}>
                              {formattedDate} {formattedTime && `• ${formattedTime}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{mt: 1, mb: 1}}>
                              {event.venue}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{mt: 1, mb: 1}}>
                              {event.address} {event.city}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{mt: 1, mb: 1}}>
                              Εισιτήρια από: {startingPrice}€
                            </Typography>
                          </Box>

                          <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mr: 5, minWidth: '220px'}}>
                            <Button 
                              sx={{...buttonStyle, width: '100%', borderRadius: 1}}
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
                  <Box sx={{textAlign: 'center', mt: 4}}>
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