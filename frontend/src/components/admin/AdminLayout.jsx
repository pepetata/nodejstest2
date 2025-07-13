import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import '../../styles/admin/adminLayout.scss';

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
