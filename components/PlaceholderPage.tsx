
import React from 'react';

interface PlaceholderPageProps {
  title: string;
  message?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, message }) => {
  return (
    <div className="text-center py-10">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-gray-400 mt-4">
        {message || "Fitur ini sedang dalam pengembangan. Segera hadir!"}
      </p>
    </div>
  );
};

export default PlaceholderPage;