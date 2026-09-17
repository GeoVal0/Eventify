import React, { useState, useEffect } from 'react';
import {Paper, Box, Typography, IconButton, Tabs, Tab, List, ListItem, ListItemText, Divider, Badge, TextField, Button, CircularProgress, Select, MenuItem, FormControl, InputLabel, ToggleButtonGroup, ToggleButton} from '@mui/material';
import AppTheme from '../shared-theme/AppTheme';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import {useLocation } from 'react-router-dom';
import {useAuth } from '../context/AuthContext';
import {getMessages, getSentMessages, sendMessage, markMessageAsRead, deleteMessage, fetchWithAuth, getEventDetail, getMyEvents, getEventBookings } from '../api'; 

export default function Messages(props) {
  const { user } = useAuth();
  const location = useLocation();
  const [currentFolder, setCurrentFolder] = useState(0); // 0 -> incoming, 1 -> sent, 2 -> new message
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const [bookedEvents, setBookedEvents] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [organizerEventsLoading, setOrganizerEventsLoading] = useState(false);
  const [organizerEventsError, setOrganizerEventsError] = useState(null);
  const [selectedOrganizerEventId, setSelectedOrganizerEventId] = useState('');
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState(null);
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [sending, setSending] = useState(false);

  const [composeMode, setComposeMode] = useState(null);       // attendee or organizer

  // fetches all messages
  const fetchAllMessages = async () => {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const [inboxData, sentData] = await Promise.all([
        getMessages(),
        getSentMessages(),
      ]);
      setInbox(inboxData?.items || inboxData || []);
      setSent(sentData?.items || sentData || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessagesError("Δεν ήταν δυνατή η φόρτωση των μηνυμάτων.");
    } finally {
      setMessagesLoading(false);
    }
  };

  // fetches all bookings a user has made
  const fetchUserBookings = async () => {
    setBookingsLoading(true);
    setBookingsError(null);
    try {
      const response = await fetchWithAuth('/api/bookings/mine');
      const bookings = Array.isArray(response) ? response : (response?.items || []);

      const uniqueEvents = [];
      const seenIds = new Set();

      for (const b of bookings) {
        const evId = b.event_id || b.eventId || b.id;
        const evTitle = b.event_title || b.eventTitle || b.title || `Εκδήλωση (${evId})`;

        if (evId && !seenIds.has(evId)) {
          seenIds.add(evId);
          uniqueEvents.push({ id: evId, title: evTitle });
        }
      }
      setBookedEvents(uniqueEvents);
      return uniqueEvents;
    } catch (error) {
      console.error("Error fetching bookings for messaging:", error);
      setBookingsError("Δεν ήταν δυνατή η φόρτωση των κρατήσεών σας.");
      return [];
    } finally {
      setBookingsLoading(false);
    }
  };

  // fetches all events an organizer has created
  const fetchOrganizerEvents = async () => {
    setOrganizerEventsLoading(true);
    setOrganizerEventsError(null);
    try {
      const response = await getMyEvents();
      const events = Array.isArray(response) ? response : (response?.items || []);
      setOrganizerEvents(events.map(ev => ({
        id: ev.event_id || ev.id,
        title: ev.title,
      })));
      return events;
    } catch (error) {
      console.error("Error fetching organizer's events:", error);
      setOrganizerEventsError("Δεν ήταν δυνατή η φόρτωση των εκδηλώσεών σας.");
      return [];
    } finally {
      setOrganizerEventsLoading(false);
    }
  };
  
  // fetches each attendee only once per event
  const fetchAttendees = async (eventId) => {
    setAttendeesLoading(true);
    setAttendeesError(null);
    try {
      const bookings = await getEventBookings(eventId);
      const uniqueAttendees = [];
      const seenIds = new Set();
      for (const b of bookings) {
        if (!seenIds.has(b.attendee_id)) {
          seenIds.add(b.attendee_id);
          uniqueAttendees.push({
            id: b.attendee_id,
            label: b.attendee_username,
          });
        }
      }
      setAttendees(uniqueAttendees);
    } catch (error) {
      console.error("Error fetching attendees:", error);
      setAttendeesError("Δεν ήταν δυνατή η φόρτωση των συμμετεχόντων.");
    } finally {
      setAttendeesLoading(false);
    }
      
  };

  useEffect(() => {
    if (!user) return;
    fetchAllMessages();
     // arrived here from ViewEvent's "message this attendee" link 
    const prefill = location.state;
    if (prefill?.prefillEventId) {
      setComposeMode('organizer');
      setCurrentFolder(2);
      setSelectedOrganizerEventId(prefill.prefillEventId);
      if (prefill.prefillAttendeeId != null) {
        setSelectedRecipientId(prefill.prefillAttendeeId);
      }
    }
    
    (async () => {
      const [bookings, events] = await Promise.all([
        fetchUserBookings(),
        fetchOrganizerEvents(),
      ]);
      if (prefill?.prefillEventId) return;
      if (bookings.length > 0) {
        setComposeMode('attendee');
      } else if (events.length > 0) {
        setComposeMode('organizer');
      }
    })();
  }, [user]);

  useEffect(() => {
    if (selectedOrganizerEventId) {
      fetchAttendees(selectedOrganizerEventId);
    } else {
      setAttendees([]);
    }
  }, [selectedOrganizerEventId]);

  
  const unreadCount = inbox.filter(msg => !msg.is_read).length;
  const activeMessages = currentFolder === 0 ? inbox : sent;

  // helpers

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await deleteMessage(id);
      setInbox(prev => prev.filter(msg => msg.id !== id));
      setSent(prev => prev.filter(msg => msg.id !== id));
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Αδυναμία διαγραφής μηνύματος.");
    }
  };

  const handleReadMessage = async (msg) => {
    if (currentFolder === 0 && !msg.is_read) {
      try {
        await markMessageAsRead(msg.id);
        setInbox(prev => prev.map(m => m.id === msg.id ? { ...m, is_read: true } : m));
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const addToSentLocally = (created, fallback) => {
    setSent(prev => [
      created && created.id ? created : { id: `local-${Date.now()}`, ...fallback },
      ...prev,
    ]);
  };

  const resetComposeFields = () => {
    setMessageSubject('');
    setMessageBody('');
  };

  const handleSendAsAttendee = async () => {
    if (!selectedEventId) {
      alert("Παρακαλώ επιλέξτε την εκδήλωση για την οποία θέλετε να στείλετε μήνυμα.");
      return;
    }

    try {
      setSending(true);
      const eventDetails = await getEventDetail(selectedEventId);

      const orgId = eventDetails.organizer_id || eventDetails.organizerId;

      if (!orgId) {
        alert("Δεν ήταν δυνατός ο εντοπισμός του διοργανωτή για αυτή την εκδήλωση.");
        return;
      }

      const payload = {
        event_id: selectedEventId,
        recipient_id: orgId,
        subject: messageSubject || 'Ερώτηση Συμμετέχοντα',
        body: messageBody,
      };
      const created = await sendMessage(payload);
      // show the message in sent immediately instead of waiting

      addToSentLocally(created, {
        event_id: selectedEventId,
        event_title: eventDetails.title,
        recipient_username: eventDetails.organizer_name || eventDetails.organizer_username,
        subject: payload.subject,
        body: payload.body,
        sent_at: new Date().toISOString(),
      });

      setSelectedEventId('');
      resetComposeFields();
      setCurrentFolder(1);
    } catch (error) {
      alert(`Σφάλμα: ${error.message}`);
    } finally {
      setSending(false);
    }
  };
      
  const handleSendAsOrganizer = async () => {
    if (!selectedOrganizerEventId) {
      alert("Παρακαλώ επιλέξτε την εκδήλωσή σας.");
      return;
    }
    if (!selectedRecipientId) {
      alert("Παρακαλώ επιλέξτε τον συμμετέχοντα στον οποίο θέλετε να στείλετε μήνυμα.");
      return;
    }
    try {
      setSending(true);
      const recipient = attendees.find(a => a.id === selectedRecipientId);
      const eventInfo = organizerEvents.find(ev => ev.id === selectedOrganizerEventId);

      const payload = {
        event_id: selectedOrganizerEventId,
        recipient_id: selectedRecipientId,
        subject: messageSubject || 'Ενημέρωση από τον διοργανωτή',
        body: messageBody,
      };
      const created = await sendMessage(payload);

      addToSentLocally(created, {
        event_id: selectedOrganizerEventId,
        event_title: eventInfo?.title,
        recipient_username: recipient?.label,
        subject: payload.subject,
        body: payload.body,
        sent_at: new Date().toISOString(),
      });

      setSelectedRecipientId('');
      resetComposeFields();
      
      setCurrentFolder(1);
    } catch (error) {
      alert(`Σφάλμα: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (!user) return null;

  const canActAsAttendee = bookedEvents.length > 0;
  const canActAsOrganizer = organizerEvents.length > 0;

  return (
    <AppTheme {...props}>
      <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'center', p: { xs: 2, md: 4 }, minHeight: '100vh', bgcolor: 'background.default'}}>
        <Paper elevation={2} sx={{width: '100%', maxWidth: 700, borderRadius: 3, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          <Box sx={{bgcolor: '#1976d2', color: 'white', p: 2}}>
            <Typography variant="h6" fontWeight="bold">Μηνύματα</Typography>
          </Box>

          <Tabs value={currentFolder} onChange={(e, newValue) => setCurrentFolder(newValue)} variant="fullWidth">
            <Tab
              label={
                <Badge badgeContent={unreadCount} color="error" sx={{'& .MuiBadge-badge': { right: -12, top: 2 }}}>
                  Εισερχόμενα
                </Badge>
              }
            />
            <Tab label="Απεσταλμένα" />
            <Tab label="Νέο" />
          </Tabs>
          <Divider />

              {/* incoming and sent tabs */}
          {(currentFolder === 0 || currentFolder === 1) && (
            <>
              {messagesLoading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                  <CircularProgress size={28} />
                </Box>
              ) : messagesError ? (
                <Box sx={{textAlign: 'center', py: 3}}>
                  <Typography variant="body2" color="error.main" sx={{mb: 1}}>{messagesError}</Typography>
                  <Button size="small" onClick={fetchAllMessages}>Δοκιμάστε ξανά</Button>
                </Box>
              ) : (
                <List sx={{bgcolor: '#f9f9f9', p: 0, minHeight: 300}}>
                  {activeMessages.length > 0 ? (
                    activeMessages.map((msg) => (
                      <React.Fragment key={msg.id}>
                        <ListItem
                          button
                          onClick={() => handleReadMessage(msg)}
                          sx={{
                            bgcolor: !msg.is_read && currentFolder === 0 ? '#e3f2fd' : 'white',
                            borderLeft: !msg.is_read && currentFolder === 0 ? '4px solid #1976d2' : '4px solid transparent'
                         }}
                          secondaryAction={
                            <IconButton edge="end" onClick={(e) => handleDelete(msg.id, e)}>
                              <DeleteIcon fontSize="small" sx={{color: 'text.secondary'}} />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography fontWeight={!msg.is_read && currentFolder === 0 ? "bold" : "medium"}>
                                {currentFolder === 0 ? (msg.sender_username || 'Άγνωστος αποστολέας') : (msg.recipient_username || 'Άγνωστος παραλήπτης')}
                              </Typography>
                            }
                            secondary={
                              <>
                                <Typography variant="caption" display="block" color="primary">
                                  {msg.event_title || msg.event_id}
                                </Typography>
                                <Typography variant="body2" color={!msg.is_read && currentFolder === 0 ? "text.primary" : "text.secondary"}>
                                  {msg.subject ? `${msg.subject} - ${msg.body}` : msg.body}
                                </Typography>
                                <Typography variant="caption" color="text.disabled">
                                  {new Date(msg.sent_at).toLocaleString('el-GR')}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))
                  ) : (
                    <Typography textAlign="center" color="text.secondary" sx={{mt: 4, py: 4}}>
                      Ο φάκελος είναι άδειος.
                    </Typography>
                  )}
                </List>
              )}
            </>
          )}
            {/* new message tab */}
          {currentFolder === 2 && (
            <Box sx={{p: 3, display: 'flex', flexDirection: 'column', gap: 2}}>
              {/* user is both an oganizer and an attendee */}
              {canActAsAttendee && canActAsOrganizer && (
                <ToggleButtonGroup
                  value={composeMode}
                  exclusive
                  size="small"
                  onChange={(e, newMode) => newMode && setComposeMode(newMode)}
                  fullWidth
                >
                  <ToggleButton value="attendee">Ως Συμμετέχων</ToggleButton>
                  <ToggleButton value="organizer">Ως Διοργανωτής</ToggleButton>
                </ToggleButtonGroup>
              )}

              {composeMode === 'attendee' && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Επιλέξτε μια από τις ενεργές κρατήσεις σας για να στείλετε μήνυμα απευθείας στον διοργανωτή.
                  </Typography>

                  {bookingsLoading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : bookingsError ? (
                    <Box sx={{textAlign: 'center', py: 1}}>
                      <Typography variant="body2" color="error.main" sx={{mb: 1}}>{bookingsError}</Typography>
                      <Button size="small" onClick={fetchUserBookings}>Δοκιμάστε ξανά</Button>
                    </Box>
                  ) : (
                    <FormControl size="small" fullWidth>
                      <InputLabel id="event-select-label">Επιλογή Εκδήλωσης</InputLabel>
                      <Select
                        labelId="event-select-label"
                        value={selectedEventId}
                        label="Επιλογή Εκδήλωσης"
                        onChange={e => setSelectedEventId(e.target.value)}
                      >
                        {bookedEvents.map(ev => (
                          <MenuItem key={ev.id} value={ev.id}>{ev.title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <TextField
                    size="small" label="Θέμα (Προαιρετικό)"
                    value={messageSubject}
                    onChange={e => setMessageSubject(e.target.value)}
                  />
                  <TextField
                    size="small" label="Μήνυμα" multiline rows={4}
                    value={messageBody}
                    onChange={e => setMessageBody(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    endIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    onClick={handleSendAsAttendee}
                    disabled={sending || !selectedEventId || !messageBody}
                  >
                    ΑΠΟΣΤΟΛΗ
                  </Button>
                </>
              )}

              {composeMode === 'organizer' && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Επιλέξτε μια από τις εκδηλώσεις σας και έναν συμμετέχοντα για να του στείλετε μήνυμα.
                  </Typography>

                  {organizerEventsLoading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : organizerEventsError ? (
                    <Box sx={{textAlign: 'center', py: 1}}>
                      <Typography variant="body2" color="error.main" sx={{mb: 1}}>{organizerEventsError}</Typography>
                      <Button size="small" onClick={fetchOrganizerEvents}>Δοκιμάστε ξανά</Button>
                    </Box>
                  ) : (
                    <FormControl size="small" fullWidth>
                      <InputLabel id="organizer-event-select-label">Επιλογή Εκδήλωσης</InputLabel>
                      <Select
                        labelId="organizer-event-select-label"
                        value={selectedOrganizerEventId}
                        label="Επιλογή Εκδήλωσης"
                        onChange={e => {
                          setSelectedOrganizerEventId(e.target.value);
                          setSelectedRecipientId('');
                       }}
                      >
                        {organizerEvents.map(ev => (
                          <MenuItem key={ev.id} value={ev.id}>{ev.title}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {selectedOrganizerEventId && (
                    attendeesLoading ? (
                      <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : attendeesError ? (
                      <Box sx={{textAlign: 'center', py: 1}}>
                        <Typography variant="body2" color="error.main" sx={{mb: 1}}>{attendeesError}</Typography>
                        <Button size="small" onClick={() => fetchAttendees(selectedOrganizerEventId)}>Δοκιμάστε ξανά</Button>
                      </Box>
                    ) : (
                      <FormControl size="small" fullWidth>
                        <InputLabel id="attendee-select-label">Επιλογή Συμμετέχοντα</InputLabel>
                        <Select
                          labelId="attendee-select-label"
                          value={selectedRecipientId}
                          label="Επιλογή Συμμετέχοντα"
                          onChange={e => setSelectedRecipientId(e.target.value)}
                        >
                          {attendees.length === 0 ? (
                            <MenuItem value="" disabled>
                              <em>Δεν υπάρχουν κρατήσεις για αυτή την εκδήλωση</em>
                            </MenuItem>
                          ) : (
                            attendees.map((a) => (
                              <MenuItem key={a.id} value={a.id}>{a.label}</MenuItem>
                            ))
                          )}
                        </Select>
                      </FormControl>
                    )
                  )}

                  <TextField
                    size="small" label="Θέμα (Προαιρετικό)"
                    value={messageSubject}
                    onChange={e => setMessageSubject(e.target.value)}
                  />
                  <TextField
                    size="small" label="Μήνυμα" multiline rows={4}
                    value={messageBody}
                    onChange={e => setMessageBody(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    endIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    onClick={handleSendAsOrganizer}
                    disabled={sending || !selectedOrganizerEventId || !selectedRecipientId || !messageBody}
                  >
                    ΑΠΟΣΤΟΛΗ
                  </Button>
                </>
              )}

              {composeMode === null && !bookingsLoading && !organizerEventsLoading && (
                <Typography textAlign="center" color="text.secondary" sx={{py: 4}}>
                  Δεν έχετε ενεργές κρατήσεις ή εκδηλώσεις για να στείλετε μήνυμα.
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </AppTheme>
  );
}
