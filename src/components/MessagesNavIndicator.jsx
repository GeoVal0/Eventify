import React, { useState, useEffect } from 'react';
import {Fab, Badge } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import {useNavigate } from 'react-router-dom';
import {useAuth } from '../context/AuthContext';
import {getMessages } from '../api';

// floating message ico that is always available when logged in
export default function MessagesNavIndicator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const fetchUnread = async () => {
      try {
        const data = await getMessages();
        const inbox = data?.items || data || [];
        if (!cancelled) {
          setUnreadCount(inbox.filter(msg => !msg.is_read).length);
        }
      } catch (error) {
        console.error("Failed to fetch unread message count:", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll for new messages while navigating
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Fab
      size="medium"
      onClick={() => navigate('/messages')}
      sx={{
        position: 'fixed',
        bottom: 40,
        right: 40,
        zIndex: 2147483647,
        bgcolor: '#1976d2',
        color: 'white',
        '&:hover': {bgcolor: '#115293' }
     }}
    >
      <Badge badgeContent={unreadCount} color="error">
        <EmailIcon sx={{fontSize: 32}}/>
      </Badge>
    </Fab>
  );
}
