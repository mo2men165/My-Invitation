import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PackageDetails, StatusDetails, ApprovalStatusDetails } from '@/types/event';

interface EventHeaderProps {
  eventName?: string;
  hostName: string;
  packageDetails: PackageDetails;
  statusDetails: StatusDetails;
  approvalStatusDetails: ApprovalStatusDetails;
}

export const EventHeader: React.FC<EventHeaderProps> = ({
  eventName,
  hostName,
  packageDetails,
  statusDetails,
  approvalStatusDetails
}) => {
  const ApprovalIcon = approvalStatusDetails.icon;

  return (
    <div className="bg-black/20 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-4">
          <Link 
            href="/events"
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة للمناسبات
          </Link>
          <div className="w-px h-6 bg-white/20"></div>
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${packageDetails.color} text-white text-sm font-medium`}>
            {packageDetails.name}
          </div>
          <div className="flex gap-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusDetails.bgColor} ${statusDetails.color}`}>
              {statusDetails.name}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${approvalStatusDetails.bgColor} ${approvalStatusDetails.color} flex items-center gap-1`}>
              <ApprovalIcon className="w-3 h-3" />
              {approvalStatusDetails.name}
            </div>
          </div>
        </div>
        {eventName ? (
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{eventName}</h1>
            <p className="text-gray-400 text-lg">المضيف: {hostName}</p>
          </div>
        ) : (
          <h1 className="text-3xl font-bold text-white">{hostName}</h1>
        )}
      </div>
    </div>
  );
};
