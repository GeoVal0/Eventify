// import React, { useState, useEffect } from 'react';
// import { 
//   Box, Typography, Button, Grid, Card, CardContent, 
//   TextField, Checkbox, FormControlLabel, 
//    Avatar, InputAdornment, Divider
// } from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
// // import PersonIcon from '@mui/icons-material/Person';
// import AppTheme from '../../shared-theme/AppTheme';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';
// import Slider from '@mui/material/Slider';
// import { getEvents } from '../../api'; // Adjust path based on your folder structure

// const getWeekKey = (dateObj) => {
//   const d = new Date(dateObj);
//   const day = d.getDay();
//   const diff = d.getDate() - day + (day === 0 ? -6 : 1);
//   const monday = new Date(d.setDate(diff));
  
//   const year = monday.getFullYear();
//   const month = String(monday.getMonth() + 1).padStart(2, '0');
//   const dayStr = String(monday.getDate()).padStart(2, '0');
//   return `${year}-${month}-${dayStr}`;
// };


// // This magically removes Greek accents (e.g., "Αθήνα" -> "αθηνα")
// const removeAccents = (str) => {
//   if (!str) return '';
//   return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
// };



// export default function EventSearchPage(props) {
//   const navigate = useNavigate(); 
//   const { user } = useAuth();

//   const [events, setEvents] = useState([]);
//   const [selectedAreas, setSelectedAreas] = useState([]);
//   const [selectedCategories, setSelectedCategories] = useState([]);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [searchArea, setSearchArea] = useState('');
//   const [filters, setFilters] = useState({
//     date: new Date().toISOString().split('T')[0],
//     time: ''
//   });

//   const handleAreaChange = (area) => {
//     setSelectedAreas((prev) => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);
//   };

//   const handleCategoryChange = (category) => {
//     setSelectedCategories((prev) => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
//   };



//   // get data
//   useEffect(() => {
//     const fetchEventData = async () => {
//       try {
//         const data = await getEvents(); // Calls your backend endpoint (e.g., /api/events)
//         // Ensure your backend items map properly to your state structure
//         setEvents(data.items || data); 
//       } catch (error) {
//         console.error("Error fetching events:", error);
//       }
//     };

//     fetchEventData();
//   }, []); // Empty dependency array ensures this only runs once when the page loads


//   const [priceRange, setPriceRange] = useState([0, 1000]);

//   const handlePriceChange = (event, newValue) => {
//     setPriceRange(newValue);
//   };

//   const filteredEvents = events.filter((event) => {
//     const safeSearch = removeAccents(searchTerm).trim();
//     const safeArea = removeAccents(searchArea).trim();

//     const eventTitle = event.title || '';
//     const eventCategory = Array.isArray(event.categories) ? event.categories[0] : (event.category || '');
//     const eventCity = event.city || '';
//     const eventAddress = event.address || '';

//     const matchesSearch = removeAccents(eventCategory).includes(safeSearch) || removeAccents(eventTitle).includes(safeSearch);

//     const ticketList = event.ticket_types || event.ticketTypes || [];
//     // const startingPrice = ticketList.length > 0 
//     //   ? Math.min(...ticketList.map(ticket => ticket.price)) 
//     //   : 0;
//     // const matchesPrice = startingPrice >= priceRange[0] && startingPrice <= priceRange[1];
//     const startingPrice = event.min_price !== null && event.min_price !== undefined ? event.min_price : 0;
//     const matchesPrice = startingPrice >= priceRange[0] && startingPrice <= priceRange[1];

//     const searchAreaText = searchArea.trim().toLowerCase();

//     const matchesAreaText = searchAreaText !== '' && (eventCity.toLowerCase().includes(searchAreaText) || eventAddress.toLowerCase().includes(searchAreaText));
//     const matchesArea = (selectedAreas.length === 0 && searchAreaText === '') || selectedAreas.includes(eventCity) || matchesAreaText;
//     const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes('Όλες') || selectedCategories.includes(eventCategory);    //anti gia category mporo na balo genre gia ta eidh

//     return matchesSearch && matchesPrice && matchesArea && matchesCategory;
//   });

// // const startingPrice = Math.min(...event.ticketTypes.map(ticket => ticket.price));

//   const buttonStyle = {
//     background: 'linear-gradient(to bottom, #2f94f8ff, #0f4d8aff) !important',
//     borderRadius: 5,
//     px: 3, py: 1,
//     fontWeight: 'bold', color: 'white',
//     border: '1px solid #1976d2',
//     boxShadow: '0 3px 5px 2px rgba(53, 77, 162, 0.3)',
//     textTransform: 'none',
//   };

//   const inputStyle = {
//     '& .MuiOutlinedInput-root': { bgcolor: '#ecebebff', borderRadius: 1, height: '35px' },
//     '& .MuiInputBase-input': { p: 1 }
//   };

//   return (
//     <AppTheme {...props}>
//       <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
//         <Box 
//           sx={{ 
//             flex: 1, 
//             bgcolor: 'background.default', 
//             color: 'text.primary', 
//             p: { xs: 2, md: 4 }, 
//             overflowY: 'auto'
//           }}
//         >
        
//           <Grid container spacing={4} alignItems="flex-start" justifyContent={!user ? 'center' : 'flex-start'}>
//             {/* filters */}
//             <Grid item xs={12} md={6} sx={{ minWidth: 0 }}> {/* minWidth: 0 strictly forces the Grid not to stretch */}
//               <Box sx={{ 
//                 bgcolor: 'white', 
//                 p: 3, 
//                 borderRadius: 2, 
//                 boxShadow: 1, 
//                 width: '100%', 
//                 // maxWidth: '100%', // Locks the width
//                 boxSizing: 'border-box', // MAGIC RULE: Forces padding to stay INSIDE the box, stopping the stretch!
//                 overflow: 'hidden' 
//               }}>
//                 <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Φίλτρα:</Typography>

//                 <Box sx={{ mb: 3 }}>
//                   <Typography fontWeight="bold" sx={{ mb: 1, fontSize: '0.9rem' }}>Περιοχή:</Typography>
//                   {['Αθήνα', 'Θεσσαλονίκη', 'Πάτρα', 'Λάρισα'].map((area) => (
//                       <FormControlLabel 
//                       key={area} 
//                       control={<Checkbox size="small" checked={selectedAreas.includes(area)} onChange={() => handleAreaChange(area)} />} 
//                       label={<Typography variant="body2">{area}</Typography>} 
//                       labelPlacement="end" 
//                       /* DELETED width: 100% so it stops pushing the walls */
//                       sx={{ mb: 0.5, display: 'flex' }} 
//                       />
//                   ))}
//                   <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
//                   <TextField 
//                     placeholder="Αναζήτηση περιοχής..." 
//                     variant="outlined"
//                     value={searchArea}
//                     onChange={(e) => setSearchArea(e.target.value)}
//                     sx={{ width: '200px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' } }}
//                     InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>) }}
//                   />
//                 </Box>
//               </Box>
                
//               <Divider sx={{ mb: 3 }} />
//                 <Box sx={{ mb: 3 }}>
//                   <Typography fontWeight="bold" sx={{ mb: 1, fontSize: '0.9rem' }}>Ημερομηνία:</Typography>
//                   {['Οποτεδήποτε', 'Σήμερα', 'Αύριο', 'Αυτή την εβδομάδα', 'Συγκεκριμένο διάστημα', 'ελευθερη εισαγωγη'].map((area) => (
//                       <FormControlLabel 
//                         key={area} 
//                         control={<Checkbox size="small"  />} 
//                         label={<Typography variant="body2">{area}</Typography>} 
//                         labelPlacement="end" 
//                         sx={{ mb: 0.5, display: 'flex' }} 
//                       />
//                   ))}
//                 </Box>

//                 <Divider sx={{ mb: 3 }} />

//                 <Box sx={{ mb: 3 }}>
//                   <Typography fontWeight="bold" sx={{ mb: 1, fontSize: '0.9rem' }}>Είδος / Κατηγορία:</Typography>
//                   {['Όλες', 'Λαϊκά', 'Έντεχνα', 'Pop', 'Rap', 'Techno'].map((category) => (
//                       <FormControlLabel 
//                       key={category} 
//                       control={<Checkbox size="small" checked={selectedCategories.includes(category)} onChange={() => handleCategoryChange(category)} />} 
//                       label={<Typography variant="body2">{category}</Typography>} 
//                       labelPlacement="end" 
//                       sx={{ mb: 0.5, display: 'flex' }} 
//                       />
//                   ))}
//                   <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
//                     <TextField 
//                       placeholder="Αναζήτηση είδους..." 
//                       variant="outlined"
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       sx={{ width: '200px', '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' } }}
//                       InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>) }}
//                     />
//                   </Box> 
//                 </Box>

//                 <Divider sx={{ mb: 3 }} />

//                 <Box sx={{ width: '100%', borderRadius: 1, boxSizing: 'border-box' }}>
//                   <Typography gutterBottom fontWeight="bold" color="text.primary" sx={{ fontSize: '0.9rem' }}>
//                     Τιμή Εισιτηρίου: {priceRange[0]}€ - {priceRange[1]}€+
//                   </Typography>
                  
//                   <Box sx={{ px: 2 }}>
//                     <Slider
//                       value={priceRange}
//                       onChange={handlePriceChange}
//                       valueLabelDisplay="auto"
//                       min={0}
//                       max={1000} 
//                       sx={{
//                         color: '#5ba7fb',
//                         '& .MuiSlider-thumb': {
//                           '&:hover, &.Mui-focusVisible': {
//                             boxShadow: '0px 0px 0px 8px rgb(91 167 251 / 16%)',
//                           },
//                         },
//                       }}
//                     />
//                   </Box>
//                 </Box>
//               </Box>
//             </Grid>

//             {/* results */}
//             <Grid item xs={12} md={6} sx={{ flexGrow: 1 }}>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
//                 <Typography variant="h4" fontWeight="bold">Εκδηλώσεις:</Typography>
//                 <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
//                   <TextField 
//                     placeholder="Αναζήτηση εκδήλωσης, χώρου, κατηγορίας..." 
//                     variant="outlined"
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     sx={{ width: { xs: '100%', sm: '500px' }, '& .MuiOutlinedInput-root': { bgcolor: 'white', borderRadius: 5, height: '40px' } }}
//                     InputProps={{ endAdornment: (<InputAdornment position="end"><SearchIcon color="action" /></InputAdornment>) }}
//                   />
//                 </Box>
//               </Box>

//               <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
//                 Βρέθηκαν {filteredEvents.length} αποτελέσματα
//               </Typography>

//               <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
//                 {filteredEvents.length > 0 ? (
//                   filteredEvents.map((event) => {

//                     // const ticketList = event.ticket_types || event.ticketTypes || [];
//                     // const startingPrice = ticketList.length > 0 ? Math.min(...ticketList.map(ticket => ticket.price)) : 0;

//                     // const eventDate = event.start_datetime || event.startDateTime;
//                     // const eventDateObj = new Date(eventDate);
//                     // const formattedDate = !isNaN(eventDateObj) ? eventDateObj.toLocaleDateString('el-GR') : 'Άγνωστη Ημερομηνία';
//                     // const formattedTime = !isNaN(eventDateObj) ? eventDateObj.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : '';

                    
//                     // 2. Υπολογίζουμε την ελάχιστη τιμή (ή null αν δεν ήρθαν εισιτήρια από το backend)
//                     const startingPrice = event.min_price;
                    
//                     // 3. Βρίσκουμε και μορφοποιούμε την ημερομηνία
//                     const eventDate = event.start_datetime || event.startDateTime;
//                     const eventDateObj = new Date(eventDate);
//                     const formattedDate = !isNaN(eventDateObj) ? eventDateObj.toLocaleDateString('el-GR') : 'Άγνωστη Ημερομηνία';
//                     const formattedTime = !isNaN(eventDateObj) ? eventDateObj.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : '';

//                     // const startingPrice = event.ticketTypes?.length > 0 ? Math.min(...event.ticketTypes.map(ticket => ticket.price)) : 0;
//                     return(
//                       <Card key={event.eventId} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'white', display: 'flex', width: '100%', flexShrink: 0, boxSizing: 'border-box', boxShadow: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
//                         <CardContent sx={{ display: 'flex', width: '100%', p: 3, gap: 4, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                          
//                           <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
//                             {/* <PersonIcon sx={{ fontSize: 80, color: 'white' }} /> */}
//                             {event.title ? event.title.charAt(0).toUpperCase() : 'E'}
//                           </Avatar>

//                           <Box sx={{ flex: 1 }}>
//                             <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>
//                               {event.title}
//                             </Typography>
//                             <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
//                               {formattedDate} {formattedTime && `• ${formattedTime}`}
//                             </Typography>
//                             <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
//                               {event.venue}
//                             </Typography>
//                             <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
//                               {event.address} {event.city}
//                               {/* {event.venue ? `${event.venue}, ` : ''}{event.address ? `${event.address}, ` : ''}{event.city} */}
//                             </Typography>
//                             <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
//                               Εισιτήρια από: {startingPrice}€
//                             </Typography>

//                             {/* <Typography variant="body1" fontWeight="bold" sx={{ color: '#2e7d32', mt: 1 }}>
//                               {startingPrice === null 
//                                 ? 'Τιμές μη διαθέσιμες' 
//                                 : startingPrice === 0 
//                                   ? 'Εισιτήρια: Δωρεάν' 
//                                   : `Εισιτήρια από: ${startingPrice}€`}
//                             </Typography> */}
//                           </Box>

//                           <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: '220px' }}>
                            
//                             {/* login for guests if they want to book an appointment */}
//                             <Button 
//                               sx={{ ...buttonStyle, width: '100%', borderRadius: 1 }}
//                               onClick={() => {
//                                   navigate('/search/BookTickets', { state: { event: event } });
//                               }}
//                             >
//                               ΚΛΕΙΣΤΕ ΕΙΣΙΤΗΡΙΑ
//                             </Button>
//                           </Box>
//                         </CardContent>
//                       </Card>
//                   );
//                 })
//                 ) : (
//                   <Box sx={{ textAlign: 'center', mt: 4 }}>
//                      <Typography variant="h6" color="text.secondary">Δεν βρέθηκαν διοργανώσεις με αυτά τα κριτήρια.</Typography>
//                   </Box>
//                 )}
//               </Box>
//             </Grid>
//           </Grid>
//         </Box>
//       </Box>
//     </AppTheme>
//   );
// }


import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Grid, Card, CardContent, 
  TextField, Checkbox, FormControlLabel, 
   Avatar, InputAdornment, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AppTheme from '../../shared-theme/AppTheme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Slider from '@mui/material/Slider';
import { getEvents } from '../../api'; 

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

export default function EventSearchPage(props) {
  const navigate = useNavigate(); 
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  
  // Filter States
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('Οποτεδήποτε');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  
  // Search Text States (Separated so they don't overwrite each other)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchArea, setSearchArea] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

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
    
    // 1. Hide Past Events (Always Active)
    if (isNaN(eventDateObj) || eventDateObj < now) {
      return false;
    }

    // 2. Date Filter
    if (selectedDateFilter === 'Σήμερα') {
      if (eventDateObj.toDateString() !== now.toDateString()) return false;
    } else if (selectedDateFilter === 'Αύριο') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (eventDateObj.toDateString() !== tomorrow.toDateString()) return false;
    } else if (selectedDateFilter === 'Αυτή την εβδομάδα') {
      if (getWeekKey(eventDateObj) !== getWeekKey(now)) return false;
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

    // 5. Category Filter
    const eventCategories = Array.isArray(event.categories) ? event.categories.map(c => c.toLowerCase()) : [];
    if (selectedCategories.length > 0 && !selectedCategories.includes('Όλες')) {
      const hasMatchingCategory = selectedCategories.some(sc => eventCategories.includes(sc.toLowerCase()));
      if (!hasMatchingCategory) return false;
    }
    
    const safeCatSearch = removeAccents(categorySearchTerm).trim();
    if (safeCatSearch !== '') {
      const matchesCatText = eventCategories.some(c => removeAccents(c).includes(safeCatSearch));
      if (!matchesCatText) return false;
    }

    // 6. Main Text Search
    const safeSearch = removeAccents(searchTerm).trim();
    if (safeSearch !== '') {
      const eventTitle = event.title || '';
      const matchesMain = removeAccents(eventTitle).includes(safeSearch) || 
                          eventCategories.some(c => removeAccents(c).includes(safeSearch));
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
        
          <Grid container spacing={4} alignItems="flex-start" justifyContent={!user ? 'center' : 'flex-start'}>
            {/* FILTERS COLUMN */}
            <Grid item xs={12} md={6} sx={{ minWidth: 0 }}> 
              <Box sx={{ 
                bgcolor: 'white', p: 3, borderRadius: 2, boxShadow: 1, 
                width: '100%', boxSizing: 'border-box', overflow: 'hidden' 
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
                  {['Οποτεδήποτε', 'Σήμερα', 'Αύριο', 'Αυτή την εβδομάδα'].map((dateOption) => (
                      <FormControlLabel 
                        key={dateOption} 
                        control={
                          <Checkbox 
                            size="small"  
                            checked={selectedDateFilter === dateOption}
                            onChange={() => setSelectedDateFilter(dateOption)}
                          />
                        } 
                        label={<Typography variant="body2">{dateOption}</Typography>} 
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
                      value={categorySearchTerm}
                      onChange={(e) => setCategorySearchTerm(e.target.value)}
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
                      max={1000} 
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
            <Grid item xs={12} md={6} sx={{ flexGrow: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h4" fontWeight="bold">Εκδηλώσεις:</Typography>
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
                    const startingPrice = event.min_price !== null && event.min_price !== undefined ? event.min_price : 0;
                    
                    const eventDate = event.start_datetime || event.startDateTime;
                    const eventDateObj = new Date(eventDate);
                    const formattedDate = !isNaN(eventDateObj) ? eventDateObj.toLocaleDateString('el-GR') : 'Άγνωστη Ημερομηνία';
                    const formattedTime = !isNaN(eventDateObj) ? eventDateObj.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' }) : '';

                    return(
                      <Card key={event.event_id || event.eventId} variant="outlined" sx={{ borderRadius: 2, bgcolor: 'white', display: 'flex', width: '100%', flexShrink: 0, boxSizing: 'border-box', boxShadow: 1, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
                        <CardContent sx={{ display: 'flex', width: '100%', p: 3, gap: 4, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                          
                          <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
                            {event.title ? event.title.charAt(0).toUpperCase() : 'E'}
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: 'black' }}>
                              {event.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                              {formattedDate} {formattedTime && `• ${formattedTime}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                              {event.venue}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                              {event.address} {event.city}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                              Εισιτήρια από: {startingPrice}€
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: '220px' }}>
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