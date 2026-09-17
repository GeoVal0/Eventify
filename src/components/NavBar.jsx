import React, { useState, useEffect } from "react";
import {useNavigate, useLocation } from "react-router-dom";
import {useAuth } from "../context/AuthContext";
import {AppBar, Toolbar, Box, Button, Menu, MenuItem, Divider } from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonIcon from '@mui/icons-material/Person';
import {getMessages, exportEventsXml, exportEventsJson } from '../api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // dropdown states
  const [registerAnchorEl, setRegisterAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  const [organizerAnchorEl, setOrganizerAnchorEl] = useState(null);
  const [adminAnchorEl, setAdminAnchorEl] = useState(null);

  const getActiveButtonFromPath = () => {
    if (location.pathname.startsWith("/organizer")) return "organizers";
    if (location.pathname.startsWith("/admin")) return "admin";
    return null; 
  };

  const [activeButton, setActiveButton] = useState(getActiveButtonFromPath());

  useEffect(() => {
    setActiveButton(getActiveButtonFromPath());
  }, [location.pathname]);

  const handleRegisterClick = (event) => setRegisterAnchorEl(event.currentTarget);
  const handleRegisterClose = () => setRegisterAnchorEl(null);

  const handleUserMenuClick = (event) => setUserMenuAnchorEl(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchorEl(null);

  const handleOrganizerClick = (event) => setOrganizerAnchorEl(event.currentTarget);
  const handleOrganizerClose = () => setOrganizerAnchorEl(null);

  const handleAdminClick = (event) => setAdminAnchorEl(event.currentTarget);
  const handleAdminClose = () => setAdminAnchorEl(null);


  const getButtonStyle = (buttonName) => ({
    fontWeight: 'bold',
    borderRadius: 2,
    px: 2,
    bgcolor: activeButton === buttonName ? 'primary.main' : 'transparent',
    color: activeButton === buttonName ? 'white' : 'text.primary',
    '&:hover': {
      bgcolor: activeButton === buttonName ? 'primary.dark' : 'rgba(0,0,0,0.05)',
    }
  });

  const handleOrganizerNavigation = (path) => {
    handleOrganizerClose();
    
    if (!user) {
      // not logged in -> go to login, remembering where we were headed
      navigate("/login", { state: { from: path } });
    } else if (user.role !== "ORGANIZER") {
      logout();
      navigate("/login", { state: { from: path } });
    } else {
      navigate(path);
    }
  };

  const handleAdminNavigation = (path) => {
    handleAdminClose();
    
    if (!user) {
      navigate("/login", { state: { from: path } });
    } else if (user.role !== "ADMIN") {
      logout();
      navigate("/login", { state: { from: path } });
    } else {
      navigate(path);
    }
  };
  
  // only ADMIN can download the files
  const handleExportEvents = async (format) => {
    handleAdminClose();

    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      logout();
      navigate("/login");
      return;
    }
    try {
      if (format === 'xml') {
        await exportEventsXml();
      } else {
        await exportEventsJson();
      }
    } catch (error) {
      console.error(`Failed to export events as ${format}:`, error);
      alert(`Αποτυχία εξαγωγής εκδηλώσεων: ${error.message}`);
    }
  };

  return (
    <AppBar position="sticky" sx={{bgcolor: 'white', color: 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
      <Toolbar sx={{display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 }}}>
        
        {/* logo */}
        <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
          <Box 
            component="img"
            src="/logo.svg"
            alt="Logo"
            onClick={() => {
              navigate("/Home");
              setActiveButton(null);
           }}
            sx={{height: 40, cursor: 'pointer', mr: 2}}
          />
        </Box>

        {/* dashboards */}
        <Box sx={{display: 'flex', gap: 2, alignItems: 'center'}}>
          
          {/* organizer dropdown */}
          <Button 
            endIcon={<KeyboardArrowDownIcon />} 
            onClick={handleOrganizerClick}
            sx={getButtonStyle("organizers")}
          >
            ΔΙΟΡΓΑΝΩΤΕΣ
          </Button>
          <Menu
            anchorEl={organizerAnchorEl}
            open={Boolean(organizerAnchorEl)}
            onClose={handleOrganizerClose}
            PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 180 }}}
          >
            <MenuItem onClick={() => handleOrganizerNavigation("/organizer/NewEvent") }>
              Νέα Εκδήλωση
            </MenuItem>
            <MenuItem onClick={() => { handleOrganizerNavigation("/organizer/EventHistory");}}>
              Ιστορικό Εκδηλώσεων
            </MenuItem>
          </Menu>

          {/* admin dropdown */}
          <Button 
            endIcon={<KeyboardArrowDownIcon />} 
            onClick={handleAdminClick}
            sx={getButtonStyle("admin")}
          >
            ΔΙΑΧΕΙΡΙΣΤΗΣ
          </Button>
          <Menu
            anchorEl={adminAnchorEl}
            open={Boolean(adminAnchorEl)}
            onClose={handleAdminClose}
            PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 180 }}}
          >
            <MenuItem onClick={() => handleAdminNavigation("/admin/UserList") }>
              Διαχείριση Χρηστών
            </MenuItem>

            <Divider />
            <MenuItem onClick={() => handleExportEvents('xml')}>
              Εξαγωγή Εκδηλώσεων (XML)
            </MenuItem>
            <MenuItem onClick={() => handleExportEvents('json')}>
              Εξαγωγή Εκδηλώσεων (JSON)
            </MenuItem>
          </Menu>

          <Divider 
            orientation="vertical" 
            variant="middle" 
            flexItem 
            sx={{borderColor: '#e0e0e0', my: 0.5, mx: 1}} 
          />

          {!user ? (
            <>
              {/* register dropdown */}
              <Button 
                endIcon={<KeyboardArrowDownIcon />} 
                onClick={handleRegisterClick}
                sx={{color: 'text.primary', fontWeight: 'bold'}}
              >
                ΕΓΓΡΑΦΗ
              </Button>
              <Menu
                anchorEl={registerAnchorEl}
                open={Boolean(registerAnchorEl)}
                onClose={handleRegisterClose}
                PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 150 }}}
              >
                <MenuItem onClick={() => { handleRegisterClose(); navigate("/sign-up/SignUpAttendee");}}>
                  Χρήστης
                </MenuItem>
                <MenuItem onClick={() => { handleRegisterClose(); navigate("/sign-up/SignUpOrganizer");}}>
                  Διοργανωτής
                </MenuItem>
              </Menu>

              {/* login button */}
              <Button 
                variant="contained" 
                color="primary" 
                sx={{borderRadius: 5, px: 3, fontWeight: 'bold'}}
                onClick={() => navigate("/login")}
              >
                ΣΥΝΔΕΣΗ
              </Button>
            </>
          ) : (
            <>

              {/* loged in user dropdown */}
              <Button
                variant="outlined"
                startIcon={<PersonIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleUserMenuClick}
                sx={{borderRadius: 5, fontWeight: 'bold', borderColor: '#ccc', color: 'text.primary'}}
              >
                {user.name || user.username || "Προφίλ"}
              </Button>
              <Menu
                anchorEl={userMenuAnchorEl}
                open={Boolean(userMenuAnchorEl)}
                onClose={handleUserMenuClose}
                PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 200 }}}
              >
                {user.role !== "ADMIN" && (
                  <MenuItem onClick={() => {
                    handleUserMenuClose();
                    if (user.role === "ORGANIZER") {
                      navigate("/edit/EditOrganizer");
                    } else if (user.role === "ATTENDEE") {
                      navigate("/edit/EditAttendee");
                    }
                 }}>
                    Επεξεργασία Προφίλ
                  </MenuItem>
                )}
                <MenuItem onClick={() => {
                  handleUserMenuClose();
                  logout();
                  navigate("/Home");
               }}>
                  Αποσύνδεση
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}