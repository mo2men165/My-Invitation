// src/app/events/page.tsx
'use client';
import React from 'react';
import { InstantRouteGuard } from '@/components/auth/InstantRouteGuard';
import { MyEventsPage } from '@/components/collaboration/MyEventsPage';

const EventsPageContent: React.FC = () => {
  return <MyEventsPage />;
};

const EventsPage: React.FC = () => {
  return (
    <InstantRouteGuard allowedRoles={['user']}>
      <EventsPageContent />
    </InstantRouteGuard>
  );
};

export default EventsPage;