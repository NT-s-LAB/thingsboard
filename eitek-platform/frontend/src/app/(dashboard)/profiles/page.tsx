'use client';

import React from 'react';
import Link from 'next/link';

const ProfilesPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
        <p className="text-gray-600">Manage device and asset profiles from ThingsBoard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Profiles Card */}
        <Link href="/profiles/device-profiles">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Device Profiles</h2>
                <p className="text-sm text-gray-500">Device Type</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Define device types with transport configuration (MQTT, CoAP, LwM2M, SNMP), provisioning settings, and alarm rules. 
              Each device in ThingsBoard is associated with a device profile.
            </p>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
              Manage Device Profiles
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* Asset Profiles Card */}
        <Link href="/profiles/asset-profiles">
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Asset Profiles</h2>
                <p className="text-sm text-gray-500">Asset Type</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm">
              Define asset types for organizing and grouping physical or logical entities. 
              Assets represent things like buildings, rooms, areas, or any non-device entity in your IoT system.
            </p>
            <div className="mt-4 flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700">
              Manage Asset Profiles
              <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default ProfilesPage;
