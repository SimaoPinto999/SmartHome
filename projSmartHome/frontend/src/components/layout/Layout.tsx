import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileMenu from './MobileMenu';
import { IntrusionAlertModal } from '../IntrusionAlertModal';

interface LayoutProps {
  title: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: (value: string) => void;
  topbarRight?: React.ReactNode;
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export default function Layout({
  title,
  showSearch,
  searchPlaceholder,
  searchValue,
  onSearch,
  topbarRight,
  children,
  rightSidebar
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      <IntrusionAlertModal />
      <Sidebar />
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Topbar
          title={title}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearch={onSearch}
          extraActions={topbarRight}
          onMenuOpen={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
          <div className="p-6 md:p-8 lg:p-10 mx-auto w-full max-w-[1600px] flex flex-col xl:flex-row gap-8">
            <div className="flex-1 min-w-0 space-y-8 pb-10">
              {children}
            </div>
            {rightSidebar && (
              <aside className="w-full xl:w-80 shrink-0 space-y-8">
                {rightSidebar}
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
