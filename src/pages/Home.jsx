import React, {useState, useEffect, useRef} from 'react';
import {Box, Typography, Button, TextField, Divider, IconButton, Container, Card, CardContent, CardMedia} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import {useNavigate} from 'react-router-dom';
import AppTheme from '../shared-theme/AppTheme';
import {useAuth} from '../context/AuthContext';
import {getEvents, getRecommendations} from '../api'; // Εισαγωγή του API function

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

export default function Home(props) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [events, setEvents] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);


  // Personalized recommendations (assignment §13, Biased Matrix
  // Factorization, GET /api/recommendations). Attendee-only on the
  // backend and requires being logged in -- for guests and
  // organizers/admins (or if the call fails for any reason) this quietly
  // falls back to `events` (all events) below, which is what this
  // carousel already showed before recommendations existed.
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [usingRecommendations, setUsingRecommendations] = useState(false);
  const [coldStart, setColdStart] = useState(false);
  
  const dateRef = useRef(null);
  const navigate = useNavigate();
  const eventsContainerRef = useRef(null);
  const categoriesRef = useRef(null);

  // Φόρτωση δεδομένων από τη βάση κατά την αρχικοποίηση
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await getEvents();
        const fetchedEvents = data.items || data || [];

        const now = new Date();
        const activeEvents = fetchedEvents.filter(ev => {
          const eventDate = new Date(ev.start_datetime);
          return !isNaN(eventDate) && eventDate >= now;
        });
        setEvents(activeEvents);

        // Define the specific categories we want to show on the homepage
        setCategoriesList(['Μουσική', 'Θέατρο', 'Σινεμά', 'Αθλητισμός', 'Τέχνες', 'Φεστιβάλ', 'Σεμινάρια']);
      } catch (error) {
        console.error("Failed to load events for homepage", error);
      }
    };
    fetchInitialData();
  }, []);

  // Separate effect, and deliberately gated on `user`: /api/recommendations
    // requires auth (attendee role specifically). Calling it while logged
    // out would 401 -> fetchWithAuth's global handler force-redirects to
    // /login, which would break the homepage for every guest visitor.
    useEffect(() => {
      if (!user) {
        setUsingRecommendations(false);
        return;
      }
      
      const fetchRecommendations = async () => {
        try {
          const data = await getRecommendations(10);
          setRecommendedEvents(data.events || []);
          setColdStart(!!data.cold_start);
          setUsingRecommendations(true);
        } catch (error) {
          // Expected for organizers/admins (backend is attendee-only) --
          // not an error worth surfacing, just fall back to all events.
          console.error("Recommendations unavailable, falling back to all events:", error);
          setUsingRecommendations(false);
        }
      };
      fetchRecommendations();
    }, [user]);
  
    const displayedEvents = usingRecommendations ? recommendedEvents : events;
    const recommendedHeading = usingRecommendations
      ? (coldStart ? 'Δημοφιλείς Εκδηλώσεις' : 'Προτάσεις Για Εσάς')
      : 'Προτεινόμενες Εκδηλώσεις';

  const handleSearch = () => {
    if (!searchTerm.trim() && !searchDate) return;
    const params = new URLSearchParams();
    if (searchTerm) params.append('query', searchTerm);
    if (searchDate) params.append('date', searchDate);
    
    // Διορθώθηκε το route για να ταιριάζει με το App.jsx σας
    navigate(`/search/SearchEvents?${params.toString()}`);
  };

  const handleCategoryClick = (category) => {
    navigate(`/search/SearchEvents?categories=${encodeURIComponent(category)}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const calendar = () => {
    if (dateRef.current) dateRef.current.showPicker();
  }

  const scrollRecommended = (direction) => {
    if (eventsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      eventsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollCategories = (direction) => {
    if (categoriesRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      categoriesRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <AppTheme {...props}>
      <Box sx={{minHeight: '100vh', bgcolor: '#ffffff', pt: 8, pb: 8}}>
        <Container maxWidth="lg">
          
          {/* =========================================
              PART 1: HERO HEADER & SEARCH
          ========================================= */}
          <Box sx={{mb: 6}}>
            <Typography variant="h3" component="h1" sx={{fontWeight: 800, mb: 1, color: '#1a1a1a', letterSpacing: '-0.5px'}}>
              Βρες το επόμενο Event που<br />θα παρευρεθείς.
            </Typography>
            <Typography variant="body1" sx={{color: '#666', mb: 5, fontSize: '1.1rem', fontStyle: 'italic'}}>
              ή δημιούργησε το δικό σου!
            </Typography>

            <Box sx={{display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: { xs: 'wrap', md: 'nowrap' }, maxWidth: 800, position: 'relative'}}>
              <TextField 
                fullWidth size="small"
                placeholder={searchDate ? `Ημερομηνία: ${searchDate}` : "Αναζήτηση εκδήλωσης, χώρου, περιοχής, ημερομηνίας..." }
                variant="outlined" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleKeyPress}
                sx={{'& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 }}}
              />
              <input
                type="date" ref={dateRef} onChange={(e) => setSearchDate(e.target.value)}
                style={{position: 'absolute', width: 0, height: 0, border: 'none', padding: 0, visibility: 'hidden'}}
              />
              <IconButton sx={{color: '#444'}} onClick={calendar}>
                <CalendarMonthIcon />
              </IconButton>
              <Button 
                variant="contained" onClick={handleSearch}
                // sx={{bgcolor: '#198754', '&:hover': {bgcolor: '#157347' }, borderRadius: 2, px: 4, py: 1, fontWeight: 'bold', textTransform: 'none', minWidth: '120px'}}
                sx={{background: 'linear-gradient(to bottom, #53b858ff, #1d5920ff) !important', '&:hover': {bgcolor: '#064a2a' }, borderRadius: 2, px: 4, py: 1, fontWeight: 'bold', textTransform: 'none', minWidth: '120px'}}
              >
                Αναζήτηση
              </Button>
            </Box>
          </Box>

          <Divider sx={{my: 5, borderColor: '#ccc'}} />

          {/* =========================================
              PART 2: RECOMMENDED EVENTS CAROUSEL
          ========================================= */}
          <Box sx={{mb: 2}}>
            <Typography variant="h6" sx={{fontWeight: 700, mb: 3, color: '#333'}}>
              {recommendedHeading}
            </Typography>
            {usingRecommendations && coldStart && (
              <Typography variant="body2" sx={{color: '#666666', mt: -2, mb: 3}}>
                Κάντε μια κράτηση ή περιηγηθείτε σε εκδηλώσεις για πιο εξατομικευμένες προτάσεις.
              </Typography>
            )}
            
            <Box sx={{position: 'relative', display: 'flex', alignItems: 'center', width: '100%'}}>
              <IconButton 
                onClick={() => scrollRecommended('left')} 
                sx={{position: 'absolute', left: -20, zIndex: 10, bgcolor: 'transparent', color: '#6e7773', boxShadow: 1, '&:hover': {bgcolor: 'transparent', color: '#353938' }}}
              >
                <PlayCircleFilledIcon sx={{fontSize: 40, transform: 'rotate(180deg)'}} />
              </IconButton>

              <Box 
                ref={eventsContainerRef} 
                sx={{
                  display: 'flex', alignItems: 'center', gap: 3, overflowX: 'auto', flex: 1, py: 2, px: 1,
                  msOverflowStyle: 'none', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }
               }}
              >
                {displayedEvents.length > 0 ? (
                  displayedEvents.map((event) => (
                    <Card 
                      key={event.event_id} 
                      onClick={() => navigate('/search/BookTickets', {state: { event }})}
                      sx={{
                        bgcolor: 'rgba(101, 198, 239, 0.47)', minWidth: 320, height: 260, borderRadius: 2, cursor: 'pointer', flexShrink: 0, 
                        display: 'flex', flexDirection: 'column',
                        '&:hover': {transform: 'translateY(-4px)', transition: '0.3s', boxShadow: 4}
                     }} 
                    >
                      <CardMedia
                        component="img"
                        height="150"
                        image={event.cover_photo 
                                ? `http://localhost:8000/static/uploads/${event.cover_photo}` 
                                : event.photos && event.photos.length > 0 
                                  ? `http://localhost:8000/static/uploads/${event.photos[0].filename || event.photos[0]}`
                                  : getFallbackImage(event)}
                        alt={event.title}
                        sx={{borderRadius: 1}}
                      />
                      <CardContent sx={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', p: 1}}>
                        <Typography variant="subtitle1" fontWeight="bold" noWrap>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(event.start_datetime).toLocaleDateString('el-GR')} • {event.venue}
                        </Typography>
                        <Typography variant="body2" color="primary" fontWeight="bold" sx={{mt: 1}}>
                          Από {event.min_price !== null ? `${event.min_price}€` : 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography color="text.secondary" sx={{py: 4, pl: 2}}>Δεν βρέθηκαν εκδηλώσεις. Δημιουργήστε μία!</Typography>
                )}
              </Box>

              <IconButton 
                onClick={() => scrollRecommended('right')} 
                sx={{position: 'absolute', right: -20, zIndex: 10, bgcolor: 'transparent', color: '#6e7773', boxShadow: 1, '&:hover': {bgcolor: 'transparent', color: '#353938'}}}
              >
                <PlayCircleFilledIcon sx={{fontSize: 40}} />
              </IconButton>
            </Box>
          </Box>

          <Divider sx={{my: 5, borderColor: '#ccc'}} />

          {/* =========================================
              PART 3: CATEGORIES CAROUSEL
          ========================================= */}
          <Box sx={{mb: 2}}>
            <Typography variant="h6" sx={{fontWeight: 700, mb: 3, color: '#333'}}>
              Κατηγορίες
            </Typography>
            
            <Box sx={{display: 'flex', position: 'relative', alignItems: 'center', width: '100%'}}>
              <IconButton 
                onClick={() => scrollCategories('left')} 
                sx={{position: 'absolute', left: -20, zIndex: 10, bgcolor: 'transparent', color: '#6e7773', boxShadow: 1, '&:hover': {bgcolor: 'transparent', color: '#353938'}}}
              >
                <PlayCircleFilledIcon sx={{fontSize: 40, transform: 'rotate(180deg)'}} />
              </IconButton>

              <Box 
                ref={categoriesRef} 
                sx={{
                  display: 'flex', alignItems: 'center', gap: 3, overflowX: 'auto', flex: 1, py: 2, px: 1,
                  msOverflowStyle: 'none', scrollbarWidth: 'none', '&::-webkit-scrollbar': {display: 'none'}
               }}
              >

              {categoriesList.map((category, index) => {
                  const categoryImages = {
                    'Μουσική': '/public/1061513-taylor-swift-en-concert-a-paris-la-defense-arena-on-y-etait-on-vous-raconte.jpg',
                    'Θέατρο': '/public/theater_01.jpg',
                    'Σινεμά': '/public/aithousa-cine-opera.jpg_1.jpg',
                    'Αθλητισμός': '/public/depositphotos_690286156-stock-photo-set-sport-equipment-soccer-basketball.jpg',
                    'Τέχνες': '/public/6113d70d63ca0-What-is-Fine-Art--Eden-Gallery-.jpeg',
                    'Φεστιβάλ': '/public/ASFF-2024-11.jpg',
                    'Σεμινάρια': '/public/what-is-a-seminar_standard.jpg'
                  };

                  const bgImage = categoryImages[category] ;

                  return (
                    <Box 
                      key={`category-${index}`} 
                      onClick={() => handleCategoryClick(category)}
                      sx={{
                        minWidth: 280, height: 260, borderRadius: 2, cursor: 'pointer', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${bgImage})`,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        '&:hover': {transform: 'scale(1.03)', transition: '0.2s', boxShadow: '0 8px 15px rgba(0,0,0,0.2)'}
                     }}
                    >
                      <Typography variant="h5" sx={{fontWeight: 'bold', color: 'white', letterSpacing: 1, textShadow: '0px 2px 4px rgba(0,0,0,0.8)'}}>
                        {category}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              
              
              <IconButton 
                onClick={() => scrollCategories('right')} 
                sx={{position: 'absolute', right: -20, zIndex: 10, bgcolor: 'transparent', color: '#6e7773', boxShadow: 1, '&:hover': {bgcolor: 'transparent', color: '#353938'}}}
              >
                <PlayCircleFilledIcon sx={{fontSize: 40}} />
              </IconButton>
            </Box>
          </Box>
          <Divider sx={{my: 5, borderColor: '#ccc'}} />

          {/* =========================================
              PART 4: CALL TO ACTION
          ========================================= */}
          <Box sx={{mb: 2, textAlign: 'center'}}>
            <Typography variant="h6" sx={{fontWeight: 700, mb: 2, color: '#333'}}>
              Είσαι Διοργανωτής;
            </Typography>
            <Typography variant="body1" sx={{color: '#666', mb: 4, fontSize: '1.1rem'}}>
              Δημιούργησε το δικό σου Event και πούλησε εισιτήρια εύκολα και γρήγορα!
            </Typography>
            <Button 
                onClick={() => navigate("/sign-up/SignUpOrganizer")}
                variant='outlined'
                size="large"
                sx={{color: 'text.primary', fontWeight: 'bold', borderColor: 'text.primary', '&:hover': {borderWidth: 2 }}}
            >
              Κάνε Εγγραφή
            </Button>
          </Box>

        </Container>
      </Box>
    </AppTheme>
  );
}