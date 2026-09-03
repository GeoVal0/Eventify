import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  AppBar, Toolbar, Box, Button, Menu, MenuItem, Typography, Divider 
} from "@mui/material";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonIcon from '@mui/icons-material/Person';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Dropdown States for Material UI
  const [registerAnchorEl, setRegisterAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);

  const getActiveButtonFromPath = () => {
    if (location.pathname.startsWith("/owner")) return "owners";
    if (location.pathname.startsWith("/vet")) return "vets";
    if (location.pathname.startsWith("/person")) return "lostPets";
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

  // Helper for MUI Button styling
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

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'white', color: 'black', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        
        {/* Left Side: Logo and Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box 
            component="img"
            src="/logo.svg"
            alt="Logo"
            onClick={() => {
              navigate("/Home");
              setActiveButton(null);
            }}
            sx={{ height: 40, cursor: 'pointer', mr: 2 }}
          />
        </Box>

        {/* Right Side: Auth Actions */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button sx={getButtonStyle("organizers")} onClick={() => navigate("/owner/OwnerDashboard")}>
            Διοργανωτες
          </Button>

          <Button sx={getButtonStyle("users")} onClick={() => navigate("/vet/VetDashboard")}>
            Χρηστες
          </Button>

          <Divider 
            orientation="vertical" 
            variant="middle" 
            flexItem 
            sx={{ borderColor: '#e0e0e0', my: 0.5, mx: 1 }} 
          />

          {!user ? (
            <>
              {/* Register Dropdown */}
              <Button 
                endIcon={<KeyboardArrowDownIcon />} 
                onClick={handleRegisterClick}
                sx={{ color: 'text.primary', fontWeight: 'bold' }}
              >
                ΕΓΓΡΑΦΗ
              </Button>
              <Menu
                anchorEl={registerAnchorEl}
                open={Boolean(registerAnchorEl)}
                onClose={handleRegisterClose}
                PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 150 } }}
              >
                <MenuItem onClick={() => { handleRegisterClose(); navigate("/sign-up/SignUpUser"); }}>
                  Χρήστης
                </MenuItem>
                <MenuItem onClick={() => { handleRegisterClose(); navigate("/sign-up/SignUpOrganizer"); }}>
                  Διοργανωτής
                </MenuItem>
              </Menu>

              {/* Login Button */}
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ borderRadius: 5, px: 3, fontWeight: 'bold' }}
                onClick={() => navigate("/login")}
              >
                ΣΥΝΔΕΣΗ
              </Button>
            </>
          ) : (
            <>
              {/* User Menu Dropdown */}
              <Button
                variant="outlined"
                startIcon={<PersonIcon />}
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleUserMenuClick}
                sx={{ borderRadius: 5, fontWeight: 'bold', borderColor: '#ccc', color: 'text.primary' }}
              >
                {user.name}
              </Button>
              <Menu
                anchorEl={userMenuAnchorEl}
                open={Boolean(userMenuAnchorEl)}
                onClose={handleUserMenuClose}
                PaperProps={{ elevation: 3, sx: { mt: 1, minWidth: 200 } }}
              >
                <MenuItem onClick={() => {
                  handleUserMenuClose();
                  if (user?.role === "ATENDEE") navigate("/edit-profile/editVet");
                  else if (user?.role === "ORGANIZER") navigate("/edit-profile/editOwner");
                }}>
                  Επεξεργασία Προφίλ
                </MenuItem>
                <MenuItem onClick={() => {
                  handleUserMenuClose();
                  logout();
                  navigate("/");
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