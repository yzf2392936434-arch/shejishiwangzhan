import React from 'react';
import { Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/Home/HomePage';
import WorksPage from './pages/Works/WorksPage';
import WorkDetailPage from './pages/WorkDetail/WorkDetailPage';
import SearchPage from './pages/Search/SearchPage';
import AboutPage from './pages/About/AboutPage';
import ResumePage from './pages/Resume/ResumePage';
import ContactPage from './pages/Contact/ContactPage';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/admin/Dashboard/DashboardPage';
import WorksAdminPage from './pages/admin/WorksAdmin/WorksAdminPage';
import WorkEditPage from './pages/admin/WorkEdit/WorkEditPage';
import CategoriesAdminPage from './pages/admin/CategoriesAdmin/CategoriesAdminPage';
import TagsAdminPage from './pages/admin/TagsAdmin/TagsAdminPage';
import MediaAdminPage from './pages/admin/MediaAdmin/MediaAdminPage';
import ProfileAdminPage from './pages/admin/ProfileAdmin/ProfileAdminPage';
import ResumeAdminPage from './pages/admin/ResumeAdmin/ResumeAdminPage';
import SettingsAdminPage from './pages/admin/SettingsAdmin/SettingsAdminPage';
import CustomerMessagesAdminPage from './pages/admin/CustomerMessagesAdmin/CustomerMessagesAdminPage';
import NavAdminPage from './pages/admin/NavAdmin/NavAdminPage';
import LayoutAdminPage from './pages/admin/LayoutAdmin/LayoutAdminPage';
import NewsAdminPage from './pages/admin/NewsAdmin/NewsAdminPage';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from '@client/src/components/ui/sonner';

const RoutesComponent = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster />
        <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="works" element={<WorksPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="work/:slug" element={<WorkDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="resume" element={<ResumePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="works" element={<WorksAdminPage />} />
          <Route path="works/new" element={<WorkEditPage />} />
          <Route path="works/:id/edit" element={<WorkEditPage />} />
          <Route path="categories" element={<CategoriesAdminPage />} />
          <Route path="tags" element={<TagsAdminPage />} />
          <Route path="media" element={<MediaAdminPage />} />
          <Route path="profile" element={<ProfileAdminPage />} />
          <Route path="resume" element={<ResumeAdminPage />} />
          <Route path="messages" element={<CustomerMessagesAdminPage />} />
          <Route path="settings" element={<SettingsAdminPage />} />
          <Route path="navigation" element={<NavAdminPage />} />
          <Route path="layout" element={<LayoutAdminPage />} />
          <Route path="news" element={<NewsAdminPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default RoutesComponent;
