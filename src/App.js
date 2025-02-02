// App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import TemplateEditor from './components/AdForm';
import Login from './components/login';
import TemplateManagement from './components/AdList';
import TemplatePage from './components/templatePage';
import ViewAllTemplates from "./components/viewAllTemplates";
import AdvertisementDisplay from "./components/TVAdvertisements/TVGroups/advertisement";
import TVsList from "./components/TVAdvertisements/IndividualGroup/TVsList";
import TV from "./components/TVAdvertisements/IndividualTV/TV";
import Calendar from './components/Calender';
import CampaignScheduler from './components/Calender/CampaignScheduler';
import Home from './components/home';
import DisplayUsers from './components/UserManagement/users';
import GestureRecognition from "./components/GestureRecognition";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path = "/Home" element = {<Home/>} />
        <Route path="/" element={<Login/>} />
        <Route path="/manage-templates" element={<TemplatePage />} />
        <Route path="/manage-templates/view-all" element={<ViewAllTemplates />} />
        <Route path="/template-management" element={<TemplateManagement />} />
        <Route path="/template-editor" element={<TemplateEditor/>} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/campaign-scheduler" element={<CampaignScheduler />} />
        <Route path="/advertisement-display" element={<AdvertisementDisplay />} /> {/* New route */}
        <Route path="/advertisement-display/tvgroups/:groupID" element={<TVsList/>} />
        <Route path="/advertisement-display/tvgroups/:groupID/tvs/:tvID" element={<TV />} />
        <Route path= "/manage-users" element = {<DisplayUsers/>} />
        <Route path="/gesture-recognition" element={<GestureRecognition />} />
        {/* Default route for undefined paths */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
