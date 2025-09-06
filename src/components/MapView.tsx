import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Provider {
  _id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  category: string;
  distance?: number;
}

interface MapViewProps {
  providers: Provider[];
  userLocation: { lat: number; lng: number } | null;
  onProviderSelect: (providerId: string) => void;
  selectedProvider: string | null;
}

// Custom icon for user location
const userLocationIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="blue" width="24" height="24">
      <circle cx="12" cy="12" r="8" fill="blue" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Custom icon for providers
const providerIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Custom icon for selected provider
const selectedProviderIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green" width="24" height="24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

function MapUpdater({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

export function MapView({ providers, userLocation, onProviderSelect, selectedProvider }: MapViewProps) {
  const [mapCenter, setMapCenter] = useState<LatLngTuple>([31.9539, 35.9106]); // Default to Amman
  const [mapZoom, setMapZoom] = useState(12);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(14);
    } else if (providers.length > 0) {
      // Center map on providers
      const avgLat = providers.reduce((sum, p) => sum + p.latitude, 0) / providers.length;
      const avgLng = providers.reduce((sum, p) => sum + p.longitude, 0) / providers.length;
      setMapCenter([avgLat, avgLng]);
      setMapZoom(12);
    }
  }, [userLocation, providers]);

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      mens_salon: "صالون رجالي",
      womens_salon: "صالون نسائي",
      beauty_clinic: "عيادة تجميل",
      laser_clinic: "عيادة ليزر",
      skincare: "العناية بالبشرة",
    };
    return categories[category] || category;
  };

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapUpdater center={mapCenter} zoom={mapZoom} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>موقعك الحالي</strong>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Provider markers */}
        {providers.map((provider) => (
          <Marker
            key={provider._id}
            position={[provider.latitude, provider.longitude]}
            icon={selectedProvider === provider._id ? selectedProviderIcon : providerIcon}
            eventHandlers={{
              click: () => onProviderSelect(provider._id),
            }}
          >
            <Popup>
              <div className="min-w-48 p-2" dir="rtl">
                <h3 className="font-semibold text-lg mb-2">{provider.name}</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center">
                    <span className="text-yellow-500">★</span>
                    <span className="mr-1">
                      {provider.rating.toFixed(1)} ({provider.reviewCount})
                    </span>
                  </div>
                  <p className="text-gray-600">{getCategoryLabel(provider.category)}</p>
                  <p className="text-gray-600">📍 {provider.address}</p>
                  <p className="text-gray-600">📞 {provider.phone}</p>
                  {provider.distance && (
                    <p className="text-blue-600 font-medium">
                      📏 {provider.distance.toFixed(1)} كم
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onProviderSelect(provider._id)}
                  className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700"
                >
                  عرض التفاصيل
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
