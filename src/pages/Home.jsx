import React, { useState, useRef } from 'react';
import { 
  Box, Typography, Button, TextField, 
  Divider, IconButton, Container
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import { useNavigate } from 'react-router-dom';
import AppTheme from '../shared-theme/AppTheme';

export default function Home(props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const dateRef = useRef(null);
  const navigate = useNavigate();
  const eventsContainerRef = useRef(null);
  const categories = useRef(null);

  const handleSearch = () => {
    if (!searchTerm.trim() && !searchDate) 
      return;

    const params = new URLSearchParams();
      if (searchTerm) params.append('query', searchTerm);
      if (searchDate) params.append('date', searchDate);

    navigate(`/search-results?${params.toString()}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter')
      handleSearch();
  };

  const calendar = () => {
    if (dateRef.current)
      dateRef.current.showPicker();
  }

  const scrollRecommended = (direction) => {
    if (eventsContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      eventsContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

   const scrollCategories = (direction) => {
    if (categories.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      categories.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <AppTheme {...props}>
      <Box sx={{ minHeight: '100vh', bgcolor: '#ffffff', pt: 8, pb: 8 }}>
        <Container maxWidth="lg">
          
          {/* =========================================
              PART 1: HERO HEADER & SEARCH
          ========================================= */}
          <Box sx={{ mb: 6 }}>
            {/* Title & Subtitle */}
            <Typography 
              variant="h3" 
              component="h1"
              sx={{ fontWeight: 800, mb: 1, color: '#1a1a1a', letterSpacing: '-0.5px' }}
            >
              Βρες το επόμενο Event που<br />θα παρευρεθείς.
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: '#666', mb: 5, fontSize: '1.1rem', fontStyle: 'italic' }}
            >
              ή δημιούργησε το δικό σου!
            </Typography>

            {/* Search Bar Row */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 1, sm: 2 }, 
              flexWrap: { xs: 'wrap', md: 'nowrap' }, // Stacks on mobile, inline on desktop
              maxWidth: 800,
              position: 'relative' 
            }}>
              
              <TextField 
                fullWidth
                size="small"
                placeholder={searchDate ? `Ημερομηνία: ${searchDate}` : "Αναζήτηση εκδήλωσης, χώρου, περιοχής..." }
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyPress}
                sx={{ 
                  '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 2 } 
                }}
              />

              <input
                type="date"
                ref={dateRef}
                onChange={(e) => setSearchDate(e.target.value)}
                style={{
                  position: 'absolute', width: 0, height: 0, 
                  border: 'none', padding: 0, visibility: 'hidden'
                }}
              />
              
              <IconButton sx={{ color: '#444' }} onClick={calendar}>
                <CalendarMonthIcon />
              </IconButton>
              
              <Button 
                variant="contained" 
                onClick={handleSearch}
                sx={{ 
                  bgcolor: '#198754', // The exact nice green from your mockup
                  '&:hover': { bgcolor: '#157347' },
                  borderRadius: 2, 
                  px: 4, py: 1,
                  fontWeight: 'bold',
                  textTransform: 'none', // Prevents all-caps
                  minWidth: '120px'
                }}
              >
                Αναζήτηση
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 5, borderColor: '#ccc' }} />

          {/* =========================================
              PART 2: RECOMMENDED EVENTS CAROUSEL
          ========================================= */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#333' }}>
              Προτεινόμενες Εκδηλώσεις
            </Typography>
            
            {/* WRAPPER BOX: position 'relative' is required to make absolute arrows work */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              
              {/* LEFT ARROW (Floating) */}
              <IconButton 
                // disableRipple
                onClick={() => scrollRecommended('left')} 
                sx={{ 
                  position: 'absolute', 
                  left: -20, // Pulls the arrow slightly outside the box
                  zIndex: 10, // Forces the arrow to sit ON TOP of the grey cards
                  bgcolor: 'transparent', // Gives it a white background so it stands out
                  color: '#6e7773',
                  '&:hover': {bgcolor: 'transparent', color: '#353938' } 
                }}
              >
                <PlayCircleFilledIcon sx={{ fontSize: 40, transform: 'rotate(180deg)' }} />
              </IconButton>

              {/* THE SCROLLING TRACK */}
              <Box 
                ref={eventsContainerRef} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3, 
                  overflowX: 'auto', 
                  flex: 1, 
                  py: 1, // Padding top and bottom
                  px: 1, // Added horizontal padding so the hover effect doesn't get cut off
                  
                  // STRICT SCROLLBAR HIDING
                  msOverflowStyle: 'none',  // IE and Edge
                  scrollbarWidth: 'none',   // Firefox
                  '&::-webkit-scrollbar': { 
                    display: 'none',        // Safari and Chrome
                    width: 0,
                    height: 0
                  }
                }}
              >
                {/* Your Event Boxes */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                  <Box 
                    key={`event-${item}`} 
                    sx={{ 
                      minWidth: 340, 
                      height: 250, 
                      bgcolor: '#d9d9d9', 
                      borderRadius: 1,
                      cursor: 'pointer',
                      flexShrink: 0, 
                      '&:hover': { opacity: 0.9, transform: 'scale(0.98)', transition: '0.2s' }
                    }} 
                  />
                ))}
              </Box>

              {/* RIGHT ARROW (Floating) */}
              <IconButton 
                onClick={() => scrollRecommended('right')} 
                sx={{ 
                  position: 'absolute', 
                  right: -20, 
                  zIndex: 10, 
                  bgcolor: 'transparent',
                  color: '#6e7773',
                  '&:hover': { bgcolor: 'transparent',  color: '#353938' } 
                }}
              >
                <PlayCircleFilledIcon sx={{ fontSize: 40 }} />
              </IconButton>

            </Box>
          </Box>

          <Divider sx={{ my: 5, borderColor: '#ccc' }} />

          {/* =========================================
              PART 3: CATEGORIES CAROUSEL
          ========================================= */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#333' }}>
              Κατηγορίες
            </Typography>
            
            <Box sx={{ display: 'flex', position: 'relative', alignItems: 'center', width: '100%' }}>
              
              {/* The Category Boxes */}
              <IconButton 
                // disableRipple
                onClick={() => scrollCategories('left')} 
                sx={{ 
                  position: 'absolute', 
                  left: -20, // Pulls the arrow slightly outside the box
                  zIndex: 10, // Forces the arrow to sit ON TOP of the grey cards
                  bgcolor: 'transparent', // Gives it a white background so it stands out
                  color: '#6e7773',
                  '&:hover': {bgcolor: 'transparent', color: '#353938' } 
                }}
              >
                <PlayCircleFilledIcon sx={{ fontSize: 40, transform: 'rotate(180deg)' }} />
              </IconButton>

              <Box 
                ref={categories} 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3, 
                  overflowX: 'auto', 
                  flex: 1, 
                  py: 1, // Padding top and bottom
                  px: 1, // Added horizontal padding so the hover effect doesn't get cut off
                  
                  // STRICT SCROLLBAR HIDING
                  msOverflowStyle: 'none',  // IE and Edge
                  scrollbarWidth: 'none',   // Firefox
                  '&::-webkit-scrollbar': { 
                    display: 'none',        // Safari and Chrome
                    width: 0,
                    height: 0
                  }
                }}
              >
              {['ΜΟΥΣΙΚΗ', 'ΘΕΑΤΡΟ', 'ΧΟΡΟΣ', 'udu', 'djdj'].map((category, index) => (
                <Box 
                  key={`category-${index}`} 
                  sx={{ 
                    minWidth: 340, 
                    height: 250, 
                    bgcolor: '#d9d9d9', 
                    borderRadius: 1,
                    // display: 'flex', 
                    // alignItems: 'center', 
                    // justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    '&:hover': { opacity: 0.9, transform: 'scale(0.98)', transition: '0.2s' }
                  }}
                >
        
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1a1a1a' }}>
                    {category}
                  </Typography>
                </Box>
              ))}
            </Box>
              
              {/* Next Arrow */}
              <IconButton 
                // disableRipple
                onClick={() => scrollCategories('right')} 
                sx={{ 
                  position: 'absolute', 
                  right: -20, // Pulls the arrow slightly outside the box
                  zIndex: 10, // Forces the arrow to sit ON TOP of the grey cards
                  bgcolor: 'transparent', // Gives it a white background so it stands out
                  color: '#6e7773',
                  '&:hover': {bgcolor: 'transparent', color: '#353938' } 
                }}
              >
                <PlayCircleFilledIcon sx={{ fontSize: 40 }} />
              </IconButton>
            </Box>
          </Box>
          <Divider sx={{ my: 5, borderColor: '#ccc' }} />

          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: '#333' }}>
              Είσαι Διοργανωτής;
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ color: '#666', mb: 5, fontSize: '1.1rem' }}
            >
              δημιούργησε το δικό σου Event και πούλησε εισιτήρια εύκολα και γρήγορα!
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button 
                onClick={() => navigate("/sign-up/SignUpOrganizer")}
                variant='outlined'
                sx={{ color: 'text.primary', 
                  fontWeight: 'bold',
                  borderColor: 'text.primary', // Matches the border color to the text color
                  '&:hover': {
                    borderWidth: 2} }}
              >
                Κάνε Εγγραφή
              </Button>
            </Box>
          </Box>

        </Container>
      </Box>
    </AppTheme>
  );
}