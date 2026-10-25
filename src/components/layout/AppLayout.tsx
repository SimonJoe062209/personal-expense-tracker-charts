import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TransactionFormModal } from '../transactions/TransactionFormModal';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content wrapper */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          <Outlet />
        </main>
      </div>

      {/* Global Transaction Modal */}
      <TransactionFormModal />
    </div>
  );
};
