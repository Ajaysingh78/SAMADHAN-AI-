import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppSidebar from './AppSidebar';
import Breadcrumb from './Breadcrumb';

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <AppHeader />
      <div className="flex-1 flex overflow-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Breadcrumb items={[{ label: 'Authorized Shell Environment' }]} />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
