import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';
// Bootstrap JS (necesario para el navbar toggler)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// Tema personalizado IASD
import './styles/iasd-theme.css';

import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
