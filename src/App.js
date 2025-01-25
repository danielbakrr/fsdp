// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TemplateEditor from './components/AdForm';
import TemplateManagement from './components/AdList';
import TemplatePage from './components/templatePage';
import ViewAllTemplates from "./components/viewAllTemplates";
import AdvertisementDisplay from "./components/TVAdvertisements/TVGroups/advertisement";
import TVsList from "./components/TVAdvertisements/IndividualTVs/TVsList";
import Calendar from './components/Calender';

import Home from './components/home';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/manage-templates" element={<TemplatePage />} />
        <Route path="/manage-templates/view-all" element={<ViewAllTemplates />} />
        <Route path="/template-management" element={<TemplateManagement />} />
        <Route path="/template-editor" element={<TemplateEditor/>} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/advertisement-display" element={<AdvertisementDisplay />} /> {/* New route */}
        <Route path="/advertisement-display/tvgroups/:groupID" element={<TVsList/>} />
        {/* Default route for undefined paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
