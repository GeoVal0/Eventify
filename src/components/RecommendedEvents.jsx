import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardMedia, CardContent, Chip, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRecommendations, API_BASE_URL } from '../api';

// Personalized event recommendations (assignment §13): backed by
// GET /api/recommendations, which trains a fresh Biased Matrix
// Factorization model server-side on this attendee's booking/view
// history (see recommender.py). Attendee-only on the backend
// (auth.require_attendee) -- organizers/admins get a 403, which this
// treats as "nothing to show here" rather than an error, since it's
// expected role behavior, not a failure.
export default function RecommendedEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [coldStart, setColdStart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      return;
    }

    let cancelled = false;
    const fetchRecommendations = async () => {
      try {
        const data = await getRecommendations(10);
        if (cancelled) return;
        setEvents(data.events || []);
        setColdStart(!!data.cold_start);
      } catch (error) {
        // A 403 here just means this user isn't an attendee (organizer/
        // admin) -- the backend enforces that, so quietly hide the section
        // instead of showing an error for something that isn't one.
        if (!cancelled) {
          console.error("Error fetching recommendations:", error);
          setVisible(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRecommendations();
    return () => { cancelled = true; };
  }, [user]);

  if (!visible) return null;
  if (!loading && events.length === 0) return null;

  const formatDate = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('el-GR', { day: 'numeric', month: 'short' });
  };

  const priceLabel = (ev) => {
    if (ev.min_price == null) return '';
    if (ev.min_price === ev.max_price) return `${ev.min_price}€`;
    return `${ev.min_price}€ - ${ev.max_price}€`;
  };

  return (
    <Box sx={{ width: '100%', py: 3 }}>
      <Box sx={{ px: { xs: 2, md: 4 }, mb: 2 }}>
        <Typography variant="h5" fontWeight="bold">
          {coldStart ? 'Δημοφιλείς Εκδηλώσεις' : 'Προτάσεις Για Εσάς'}
        </Typography>
        {coldStart && (
          <Typography variant="body2" color="text.secondary">
            Κάντε μια κράτηση ή περιηγηθείτε σε εκδηλώσεις για πιο εξατομικευμένες προτάσεις.
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            overflowX: 'auto',
            px: { xs: 2, md: 4 },
            pb: 1,
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: 4 },
          }}
        >
          {events.map((ev) => (
            <Card
              key={ev.event_id}
              onClick={() => navigate('/search/BookTickets', { state: { event: ev } })}
              sx={{
                minWidth: 260, maxWidth: 260, flexShrink: 0, borderRadius: 3,
                cursor: 'pointer', transition: 'transform 0.15s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
            >
              {ev.cover_photo ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={`${API_BASE_URL}/static/uploads/${ev.cover_photo}`}
                  alt={ev.title}
                />
              ) : (
                <Box sx={{ height: 140, bgcolor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="#1976d2">
                    {ev.title ? ev.title.charAt(0).toUpperCase() : 'E'}
                  </Typography>
                </Box>
              )}
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" noWrap>{ev.title}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {ev.venue}, {ev.city}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                  <Chip label={formatDate(ev.start_datetime)} size="small" />
                  {priceLabel(ev) && (
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {priceLabel(ev)}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}
