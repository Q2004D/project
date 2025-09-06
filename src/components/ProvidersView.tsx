import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { MapView } from "./MapView";
import { EnhancedProviderDetails } from "./EnhancedProviderDetails";

interface Provider {
  _id: Id<"providers">;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  latitude: number;
  longitude: number;
  category: string;
  rating: number;
  reviewCount: number;
  services: any[];
}

export function ProvidersView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<Id<"providers"> | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  // Get user's location (default to Amman, Jordan)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission("granted");
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationPermission("denied");
          // Default to Amman, Jordan
          setUserLocation({ lat: 31.9539, lng: 35.9106 });
        }
      );
    } else {
      // Default to Amman, Jordan if geolocation is not supported
      setUserLocation({ lat: 31.9539, lng: 35.9106 });
    }
  }, []);

  const providers = useQuery(api.providers.searchProviders, {
    searchQuery: searchQuery || undefined,
    category: selectedCategory as any || undefined,
    latitude: userLocation?.lat,
    longitude: userLocation?.lng,
    maxDistance: viewMode === "map" ? maxDistance : undefined,
  });

  const providerDetails = useQuery(
    api.providers.getProvider,
    selectedProvider ? { providerId: selectedProvider } : "skip"
  );

  const categories = [
    { value: "", label: "جميع الفئات" },
    { value: "mens_salon", label: "صالون رجالي" },
    { value: "womens_salon", label: "صالون نسائي" },
    { value: "beauty_clinic", label: "عيادة تجميل" },
    { value: "laser_clinic", label: "عيادة ليزر" },
    { value: "skincare", label: "العناية بالبشرة" },
  ];

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission("granted");
          toast.success("تم تحديد موقعك بنجاح");
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationPermission("denied");
          toast.error("لا يمكن الوصول إلى موقعك");
        }
      );
    }
  };

  if (selectedProvider && providerDetails) {
    return (
      <EnhancedProviderDetails
        provider={providerDetails}
        onBack={() => setSelectedProvider(null)}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Call to Action for Business Owners */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white p-4 md:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-right">
            <h3 className="text-lg md:text-xl font-bold mb-2">هل تملك صالون أو مركز تجميل؟</h3>
            <p className="text-purple-100 text-sm md:text-base">انضم إلى منصتنا واستقبل المزيد من العملاء في الأردن</p>
          </div>
          <button
            onClick={() => {
              const event = new CustomEvent('navigate-to-register');
              window.dispatchEvent(event);
            }}
            className="bg-white text-purple-600 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm md:text-base whitespace-nowrap"
          >
            🏪 سجل مؤسستك الآن
          </button>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">البحث عن الخدمات في الأردن</h2>
          
          <div className="flex space-x-2 space-x-reverse w-full md:w-auto">
            <button
              onClick={() => setViewMode("list")}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                viewMode === "list"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              📋 قائمة
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                viewMode === "map"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🗺️ خريطة
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البحث
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن صالون أو خدمة..."
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الفئة
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {viewMode === "map" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المسافة القصوى (كم)
              </label>
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
              >
                <option value={5}>5 كم</option>
                <option value={10}>10 كم</option>
                <option value={20}>20 كم</option>
                <option value={50}>50 كم</option>
              </select>
            </div>
          )}
        </div>

        {/* Location status */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 gap-3">
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-sm text-gray-700 font-medium">
              {locationPermission === "granted" 
                ? "📍 تم تحديد موقعك في الأردن" 
                : locationPermission === "denied"
                ? "❌ لا يمكن الوصول للموقع"
                : "📍 الموقع غير محدد"}
            </span>
            {userLocation && locationPermission === "granted" && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                يتم ترتيب النتائج حسب القرب منك
              </span>
            )}
          </div>
          
          {locationPermission !== "granted" && (
            <button
              onClick={requestLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              تحديد الموقع
            </button>
          )}
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">خريطة مقدمي الخدمة في الأردن</h3>
          <div className="rounded-lg overflow-hidden">
            <MapView
              providers={providers as Provider[] || []}
              userLocation={userLocation}
              onProviderSelect={(providerId) => setSelectedProvider(providerId as Id<"providers">)}
              selectedProvider={selectedProvider}
            />
          </div>
          
          {providers && providers.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              تم العثور على {providers.length} مقدم خدمة
              {userLocation && " مرتبة حسب القرب من موقعك"}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {providers?.map((provider: any) => (
            <div
              key={provider._id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-200 group"
              onClick={() => setSelectedProvider(provider._id)}
            >
              <div className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {provider.name}
                  </h3>
                  <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                    <span className="text-yellow-500 text-sm">★</span>
                    <span className="text-sm text-gray-700 mr-1 font-medium">
                      {provider.rating?.toFixed(1) || '0.0'}
                    </span>
                    <span className="text-xs text-gray-500 mr-1">
                      ({provider.reviewCount || 0})
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  {provider.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-blue-500">📍</span>
                    <span className="mr-2 line-clamp-1">{provider.address}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-green-500">📞</span>
                    <span className="mr-2 font-medium">{provider.phone}</span>
                  </div>

                  {(provider as any).distance && (
                    <div className="flex items-center text-sm text-blue-600 font-medium">
                      <span>📏</span>
                      <span className="mr-2">{(provider as any).distance.toFixed(1)} كم من موقعك</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                    {categories.find(c => c.value === provider.category)?.label}
                  </span>
                  
                  <div className="text-xs text-gray-400">
                    اضغط للتفاصيل
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {providers?.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد مقدمي خدمة حالياً</h3>
            <p className="text-gray-500 mb-4">لم يتم العثور على مقدمي خدمة في المنطقة المحددة</p>
            {viewMode === "map" && maxDistance < 50 && (
              <p className="text-sm text-gray-400 mb-6">
                جرب زيادة المسافة القصوى للبحث أو تغيير الفئة
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-4">
              هل تملك صالون أو مركز تجميل؟ انضم إلى منصتنا الآن!
            </p>
            <button
              onClick={() => {
                const event = new CustomEvent('navigate-to-register');
                window.dispatchEvent(event);
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              🏪 سجل مؤسستك الآن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
