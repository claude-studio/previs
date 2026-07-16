import '@fontsource-variable/dm-sans/index.css';
import 'pretendard/dist/web/variable/pretendardvariable.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
