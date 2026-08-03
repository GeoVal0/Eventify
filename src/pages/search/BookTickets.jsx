import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Avatar, Grid
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AppTheme from '../../shared-theme/AppTheme';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; 
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';




const latitude = event.geoLocation?.latitude ? parseFloat(event.geoLocation.latitude) : 37.9838; // Default to Athens
const longitude = event.geoLocation?.longitude ? parseFloat(event.geoLocation.longitude) : 23.7275; // Default to Athens
const position = [latitude, longitude];

// export default function BookTickets(props) {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useAuth(); 

  
// //   const initialUser = location.state?.vet || fallbackUser; 
// //   const [userData, setUserData] = useState(initialUser);




//   useEffect(() => {
//       // Fake Event Data to test the UI
//       const dummyEvents = [
//         {
//           id: 1,
//           title: "Νίκος Οικονομόπουλος",
//           category: "Μουσική",
//           eventType: "Συναυλία",
//           venue: "Θέατρο Πόλης",
//           address: "Αριστοτέλους 15",
//           city: "Αθήνα",
//           country: "Ελλάδα",
//           geoLocation: { latitude: "37.9838", longitude: "23.7275" },
//           startDateTime: "2024-09-15T20:00:00",
//           endDateTime: "2024-09-15T23:00:00",
//           capacity: 800,
//           price: 25,
//           ticketTypes: [
//             {
//               ticketTypeID: 1,
//               name: "Γενική Είσοδος",
//               price: 15,
//               quantity: 1500,
//               available: 1500,
//             },
//             {
//               ticketTypeID: 2,
//               name: "VIP",
//               price: 50,
//               quantity: 500,
//               available: 500,
//             }
//           ],
//           bookings: [
//             {
//               bookingID: 1,
//               attendeeID: 1,
//               time:"2024-09-13T20:00:00",
//               ticketType: 1,
//               numberOfTickets: 2,
//               totalCost: 30,
//               bookingStatus: "confiermed"
//             }
//           ],
//           organizerID: 1,
//           status: "published",
//           description: "Ο Νίκος Οικονομόπουλος είναι ένας από τους πιο δημοφιλείς Έλληνες τραγουδιστές, γνωστός για τις επιτυχίες του στον χώρο της λαϊκής μουσικής. Με μια καριέρα που ξεκίνησε από τα πρώτα του βήματα σε μουσικά σχήματα και συνεχίστηκε με πολυάριθμες συναυλίες και δίσκους, ο Οικονομόπουλος έχει καταφέρει να κερδίσει την αγάπη του κοινού με τη μοναδική φωνή και το πάθος του για τη μουσική.",
//           media: [
//             {
//               photo: "colorday_cover.jpg"
//             }
//           ]
//         },
//         {
//           id: 2,
//           title: "Color Day",
//           category: "Μουσική",
//           eventType: "Φεστιβαλ",
//           venue: "ΟΑΚΑ",
//           address: "Μαρουσι",
//           city: "Αθήνα",
//           country: "Ελλάδα",
//           geoLocation: { latitude: "37.9838", longitude: "23.7275" },
//           startDateTime: "2024-09-15T20:00:00",
//           endDateTime: "2024-09-15T23:00:00",
//           capacity: 2000,
//           ticketTypes: [
//             {
//               ticketTypeID: 1,
//               name: "Γενική Είσοδος",
//               price: 15,
//               quantity: 1500,
//               available: 1500,
//             },
//             {
//               ticketTypeID: 2,
//               name: "VIP",
//               price: 50,
//               quantity: 500,
//               available: 500,
//             }
//           ],
//           bookings: [
//             {
//               bookingID: 1,
//               attendeeID: 1,
//               time:"2024-09-13T20:00:00",
//               ticketType: 1,
//               numberOfTickets: 2,
//               totalCost: 30,
//               bookingStatus: "confiermed"
//             }
//           ],
//           organizerID: 1,
//           status: "published",
//           description: "Το Color Day Festival είναι ένα από τα μεγαλύτερα μουσικά φεστιβάλ στην Ελλάδα, γνωστό για την εντυπωσιακή του ατμόσφαιρα και την ποικιλία των καλλιτεχνών που συμμετέχουν. Με χιλιάδες επισκέπτες κάθε χρόνο, το φεστιβάλ προσφέρει μια μοναδική εμπειρία γεμάτη μουσική, χρώματα και διασκέδαση.",
//           media: [
//             {
//               photo: "colorday_cover.jpg"
//             }
//           ]
//         },
//         {
//           id: 3,
//           title: "Bloody Hawk",
//           category: "Μουσική",
//           eventType: "Συναυλία",
//           venue: "Θέατρο Λυκαβηττού",
//           address: "Λυκαβηττός",
//           city: "Αθήνα",
//           country: "Ελλάδα",
//           geoLocation: { latitude: "37.9838", longitude: "23.7275" },
//           startDateTime: "2024-09-15T20:00:00",
//           endDateTime: "2024-09-15T23:00:00",
//           capacity: 1000,
//           price: 12,ticketTypes: [
//             {
//               ticketTypeID: 1,
//               name: "Γενική Είσοδος",
//               price: 15,
//               quantity: 1500,
//               available: 1500,
//             },
//             {
//               ticketTypeID: 2,
//               name: "VIP",
//               price: 50,
//               quantity: 500,
//               available: 500,
//             }
//           ],
//           bookings: [
//             {
//               bookingID: 1,
//               attendeeID: 1,
//               time:"2024-09-13T20:00:00",
//               ticketType: 1,
//               numberOfTickets: 2,
//               totalCost: 30,
//               bookingStatus: "confiermed"
//             }
//           ],
//           organizerID: 1,
//           status: "published",
//           description: "Το Bloody Hawk είναι ένα από τα πιο δημοφιλή μουσικά οργανώματα στην Ελλάδα, γνωστό για την εντυπωσιακή του ατμόσφαιρα και την ποικιλία των καλλιτεχνών που συμμετέχουν.",
//           media: [
//             {
//               photo: "colorday_cover.jpg"
//             }
//           ]
//         },
//         {
//           id: 4,
//           title: "Ο Τυχαίος Θάνατος Ενός Αναρχικού",
//           category: "Θεατρο",
//           eventType: "Θεατρική παράσταση",
//           venue: "Θέατρο Πόλης",
//           address: "Αριστοτέλους 15",
//           city: "Θεσσαλονίκη",
//           country: "Ελλάδα",
//           geoLocation: { latitude: "37.9838", longitude: "23.7275" },
//           startDateTime: "2024-09-15T20:00:00",
//           endDateTime: "2024-09-15T23:00:00",
//           capacity: 800,
//           price: 20,ticketTypes: [
//             {
//               ticketTypeID: 1,
//               name: "Γενική Είσοδος",
//               price: 18,
//               quantity: 1500,
//               available: 1500,
//             },
//             {
//               ticketTypeID: 2,
//               name: "VIP",
//               price: 50,
//               quantity: 500,
//               available: 500,
//             }
//           ],
//           bookings: [
//             {
//               bookingID: 1,
//               attendeeID: 1,
//               time:"2024-09-13T20:00:00",
//               ticketType: 1,
//               numberOfTickets: 2,
//               totalCost: 30,
//               bookingStatus: "confiermed"
//             }
//           ],
//           organizerID: 1,
//           status: "published",
//           description: "Η παράσταση 'Ο Τυχαίος Θάνατος Ενός Αναρχικού' είναι ένα από τα πιο γνωστά έργα του Ιταλού θεατρικού συγγραφέα Ντάριο Φο. Το έργο εξετάζει θέματα κοινωνικής δικαιοσύνης, πολιτικής διαφθοράς και ανθρώπινης ηθικής μέσα από μια έντονη και συχνά σατιρική προσέγγιση.",
//           media: [
//             {
//               photo: "colorday_cover.jpg"
//             }
//           ]
//         },
//         {
//           id: 5,
//           title: "Amelie Lens",
//           category: "Μουσική",
//           eventType: "DJ Set",
//           venue: "Cozmo",
//           address: "Λεωφόρος Συγγρού 100",
//           city: "Πάτρα",
//           country: "Ελλάδα",
//           geoLocation: { latitude: "37.9838", longitude: "23.7275" },
//           startDateTime: "2024-09-15T20:00:00",
//           endDateTime: "2024-09-15T23:00:00",
//           capacity: 800,
//           price: 45,ticketTypes: [
//             {
//               ticketTypeID: 1,
//               name: "Γενική Είσοδος",
//               price: 20,
//               quantity: 1500,
//               available: 1500,
//             },
//             {
//               ticketTypeID: 2,
//               name: "VIP",
//               price: 50,
//               quantity: 500,
//               available: 500,
//             }
//           ],
//           bookings: [
//             {
//               bookingID: 1,
//               attendeeID: 1,
//               time:"2024-09-13T20:00:00",
//               ticketType: 1,
//               numberOfTickets: 2,
//               totalCost: 30,
//               bookingStatus: "confiermed"
//             }
//           ],
//           organizerID: 1,
//           status: "published",
//           description: "Η Amelie Lens είναι μια από τις πιο αναγνωρισμένες DJs και παραγωγούς στον κόσμο της ηλεκτρονικής μουσικής, γνωστή για τα δυναμικά της set και την ικανότητά της να δημιουργεί μοναδική ατμόσφαιρα σε κάθε εμφάνισή της. Με διεθνή καριέρα και συμμετοχές σε μεγάλα φεστιβάλ, η Lens έχει κερδίσει την εκτίμηση του κοινού και των κριτικών.",
//           media: [
//             {
//               photo: "colorday_cover.jpg"
//             }
//           ]
//         }
//       ];
  
//       setEvents(dummyEvents);
//     }, []); // Empty dependency array ensures this only runs once when the page loads







//   // --- Admin Action Handlers ---
//   const handleAccept = async (userId) => {
//     console.log("Accepting user ID:", userId);
//     // Here we will eventually add the fetch() call to the FastAPI backend
//     alert("Η εγγραφή εγκρίθηκε!");
//     // navigate('/admin/users'); // Go back to the user list
//   };

//   const handleCancel = async (userId) => {
//     console.log("Rejecting user ID:", userId);
//     // Here we will eventually add the fetch() call to the FastAPI backend
//     alert("Η εγγραφή απορρίφθηκε!");
//     // navigate('/admin/users'); // Go back to the user list
//   };

//   if (!dummyEvents) return <Typography>Φόρτωση...</Typography>;

//   const cardStyle = {
//     bgcolor: 'white', 
//     width: '100%', 
//     maxWidth: '1200px', 
//     borderRadius: 2, 
//     boxShadow: 3, 
//     p: 4, 
//     display: 'flex', 
//     flexDirection: 'column'
//   };

//   return (
//     <AppTheme {...props}>
//       <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
        
//         <Box 
//           sx={{ 
//             flex: 1, 
//             bgcolor: 'background.default', 
//             p: { xs: 2, md: 4 }, 
//             display: 'flex', 
//             justifyContent: 'center',
//             overflowY: 'auto'
//           }}
//         >
//           <Box sx={cardStyle}>
            
//             {/* Header section with User Info on the left, Buttons on the right */}
//             <Box sx={{ 
//               display: 'flex', 
//               alignItems: 'center', 
//               justifyContent: 'space-between', // Pushes buttons to the right
//               mb: 6, 
//               flexDirection: { xs: 'column', sm: 'row' }, 
//               color: 'text.primary', 
//               gap: 3 
//             }}>
              
//               {/* Left Side: Avatar and Info */}
//               <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }}}>
//                 <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
//                    <PersonIcon sx={{ fontSize: 80, color: 'white' }} />
//                 </Avatar>
//                 <Box>
//                   <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{dummyEvents.title}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{dummyEvents.venue}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{dummyEvents.address}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{dummyEvents.zip}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{dummyEvents.startDateTime}</Typography>
//                   {/* <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{dummyEvents.address}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{dummyEvents.zip}</Typography>
//                   <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{dummyEvents.afm}</Typography> */}
//                 </Box>
//               </Box>

//               {/* Right Side: Admin Action Buttons */}
              
//             </Box>

//             {/* Bottom Section: Map or other details could go here */}
//             <Grid container spacing={6}>
//               <Grid item xs={12} md={8}> 
//                  {/* Reserved space for map or extra details */}
//               </Grid>
//             </Grid>
            
//           </Box>
//         </Box>
//       </Box>
//     </AppTheme>
//   );
// }






export default function BookTickets(props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); 

  // 1. Capture the exact event the user clicked on from the Search Page!
  const event = location.state?.event;

  // --- Admin Action Handlers ---
  const handleAccept = async (userId) => {
    console.log("Accepting user ID:", userId);
    alert("Η εγγραφή εγκρίθηκε!");
  };

  const handleCancel = async (userId) => {
    console.log("Rejecting user ID:", userId);
    alert("Η εγγραφή απορρίφθηκε!");
  };

  // 2. Safety check: If someone refreshes the page and the event gets lost, show an error
  if (!event) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5">Δεν βρέθηκε η εκδήλωση.</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }} variant="contained">
          ΕΠΙΣΤΡΟΦΗ ΣΤΗΝ ΑΝΑΖΗΤΗΣΗ
        </Button>
      </Box>
    );
  }

  const cardStyle = {
    bgcolor: 'white', 
    width: '100%', 
    maxWidth: '1200px', 
    borderRadius: 2, 
    boxShadow: 3, 
    p: 4, 
    display: 'flex', 
    flexDirection: 'column'
  };

  return (
    <AppTheme {...props}>
      <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh', width: '100%' }}>
        
        <Box 
          sx={{ 
            flex: 1, 
            bgcolor: 'background.default', 
            p: { xs: 2, md: 4 }, 
            display: 'flex', 
            justifyContent: 'center',
            overflowY: 'auto'
          }}
        >
          <Box sx={cardStyle}>
            
            {/* Header section with User Info on the left, Buttons on the right */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              mb: 6, 
              flexDirection: { xs: 'column', sm: 'row' }, 
              color: 'text.primary', 
              gap: 3 
            }}>
              
              {/* Left Side: Avatar and Info */}
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' }}}>
                <Avatar variant="rounded" sx={{ width: 160, height: 160, bgcolor: '#5ba7fb', borderRadius: 2 }}>
                   <PersonIcon sx={{ fontSize: 80, color: 'white' }} />
                </Avatar>
                
                {/* 3. Replaced dummyEvents with the actual 'event' object! */}
                <Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>{event.title}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{event.venue}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{event.address}, {event.city}</Typography>
                  <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.25rem' }}>{new Date(event.startDateTime).toLocaleString('el-GR')}</Typography>
                </Box>
              </Box>
            </Box>

            {/* Bottom Section: Map or other details could go here */}
            <Grid container spacing={6}>
              <Grid item xs={12} md={8}> 
                <Typography variant="h6" sx={{ mb: 2 }}>Τοποθεσία Εκδήλωσης:</Typography>
                <Box sx={{ height: '400px', width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #ddd' }}>
                    <MapContainer center={position} zoom={15} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={position} icon={customIcon}>
                            <Popup>
                                {event.title} <br /> {event.address}, {event.city}
                            </Popup>
                        </Marker>
                    </MapContainer>
                </Box>

              </Grid>
            </Grid>
            
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
}