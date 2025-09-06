import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { api } from "../convex/_generated/api";
import { useState, useEffect } from "react";
import { ProvidersView } from "./components/ProvidersView";
import { BookingsView } from "./components/BookingsView";
import { ProviderDashboard } from "./components/ProviderDashboard";
import { AdvancedProviderDashboard } from "./components/AdvancedProviderDashboard";
import { ProfileView } from "./components/ProfileView";
import { NotificationCenter } from "./components/NotificationCenter";
import { LoyaltyProgram } from "./components/LoyaltyProgram";
import { AdminDashboard } from "./components/AdminDashboard";
import { ProviderServicePage } from "./components/ProviderServicePage";
import { ServicesManagementPage } from "./components/ServicesManagementPage";
import { ProviderRegistration } from "./components/ProviderRegistration";
import { Toaster } from "sonner";
import { Id } from "../convex/_generated/dataModel";

function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Toaster position="top-center" richColors />
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">💆</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Body Care
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                احجز موعدك في أفضل صالونات ومراكز التجميل في الأردن
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
    </main>
  );
}

function AuthenticatedApp() {
  const [activeView, setActiveView] = useState<
    "providers" | "bookings" | "dashboard" | "advanced" | "profile" | "notifications" | "loyalty" | "admin" | "provider-page" | "services-management" | "register-provider"
  >("providers");
  const [selectedProviderId, setSelectedProviderId] = useState<Id<"providers"> | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = useQuery(api.auth.loggedInUser);
  const adminUser = useQuery(api.admin.checkCurrentUserAdmin);
  const myProviders = useQuery(api.providers.getMyProviders);
  const notifications = useQuery(api.notifications.getUserNotifications, {});

  const unreadNotifications = notifications?.filter(n => !n.isRead).length || 0;

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigateToRegister = () => {
      setActiveView("register-provider");
      setIsMobileMenuOpen(false);
    };

    window.addEventListener('navigate-to-register', handleNavigateToRegister);
    return () => {
      window.removeEventListener('navigate-to-register', handleNavigateToRegister);
    };
  }, []);

  const navigationItems = [
    { key: "providers", label: "البحث عن الخدمات", icon: "🔍", color: "blue" },
    { key: "bookings", label: "حجوزاتي", icon: "📅", color: "blue" },
    { key: "loyalty", label: "برنامج الولاء", icon: "🎁", color: "blue" },
    { key: "profile", label: "الملف الشخصي", icon: "👤", color: "blue" },
    { key: "register-provider", label: "تسجيل مقدم خدمة", icon: "🏪", color: "purple" },
  ];

  const handleNavClick = (view: string) => {
    setActiveView(view as any);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 md:py-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💆</span>
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">Body Care</h1>
                {user && (
                  <span className="text-xs md:text-sm text-gray-600 hidden md:block">
                    مرحباً، {user.name || user.email}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-3 space-x-reverse">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <span className="text-xl">{isMobileMenuOpen ? "✕" : "☰"}</span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => handleNavClick("notifications")}
                className={`relative p-2 rounded-lg transition-colors ${
                  activeView === "notifications"
                    ? "bg-blue-100 text-blue-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                🔔
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              
              <SignOutButton />
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-3 space-y-2">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 space-x-reverse ${
                    activeView === item.key
                      ? item.color === "purple" 
                        ? "bg-purple-600 text-white"
                        : "bg-blue-600 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Provider sections for mobile */}
              {myProviders && myProviders.length > 0 && (
                <>
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="text-sm font-medium text-gray-500 px-4 py-2">
                      إدارة الأعمال
                    </div>
                    
                    <button
                      onClick={() => handleNavClick("dashboard")}
                      className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 space-x-reverse ${
                        activeView === "dashboard"
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>🏪</span>
                      <span>لوحة التحكم</span>
                    </button>

                    <button
                      onClick={() => handleNavClick("advanced")}
                      className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 space-x-reverse ${
                        activeView === "advanced"
                          ? "bg-green-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>📊</span>
                      <span>لوحة التحكم المتقدمة</span>
                    </button>
                  </div>
                </>
              )}

              {/* Admin section for mobile */}
              {adminUser && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="text-sm font-medium text-gray-500 px-4 py-2">
                    إدارة النظام
                  </div>
                  
                  <button
                    onClick={() => handleNavClick("admin")}
                    className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 space-x-reverse ${
                      activeView === "admin"
                        ? "bg-red-600 text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span>⚙️</span>
                    <span>لوحة تحكم الأدمن</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 md:py-8">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 md:gap-8">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm p-4 space-y-2 border border-gray-100 sticky top-24">
              {navigationItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 space-x-reverse ${
                    activeView === item.key
                      ? item.color === "purple" 
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                        : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}

              {/* Provider Dashboard */}
              {myProviders && myProviders.length > 0 && (
                <>
                  <hr className="my-4" />
                  <div className="text-sm font-medium text-gray-500 px-4 py-2">
                    إدارة الأعمال
                  </div>
                  
                  <button
                    onClick={() => handleNavClick("dashboard")}
                    className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 space-x-reverse ${
                      activeView === "dashboard"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>🏪</span>
                    <span>لوحة التحكم</span>
                  </button>

                  <button
                    onClick={() => handleNavClick("advanced")}
                    className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 space-x-reverse ${
                      activeView === "advanced"
                        ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>📊</span>
                    <span>لوحة التحكم المتقدمة</span>
                  </button>
                  
                  <div className="text-sm font-medium text-gray-500 px-4 py-2">
                    مقدمي الخدمة
                  </div>
                  
                  {myProviders?.map((provider) => (
                    <div key={provider._id} className="space-y-1">
                      <button
                        onClick={() => {
                          setSelectedProviderId(provider._id);
                          setActiveView("provider-page");
                        }}
                        className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-colors ${
                          activeView === "provider-page" && selectedProviderId === provider._id
                            ? "bg-purple-600 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        🏪 {provider.name}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProviderId(provider._id);
                          setActiveView("services-management");
                        }}
                        className={`w-full text-right px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                          activeView === "services-management" && selectedProviderId === provider._id
                            ? "bg-orange-600 text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        🛠️ إدارة خدمات {provider.name}
                      </button>
                    </div>
                  ))}
                </>
              )}

              {/* Admin Dashboard */}
              {adminUser && (
                <>
                  <hr className="my-4" />
                  <div className="text-sm font-medium text-gray-500 px-4 py-2">
                    إدارة النظام
                  </div>
                  
                  <button
                    onClick={() => handleNavClick("admin")}
                    className={`w-full text-right px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3 space-x-reverse ${
                      activeView === "admin"
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>⚙️</span>
                    <span>لوحة تحكم الأدمن</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {activeView === "providers" && <ProvidersView />}
            {activeView === "bookings" && <BookingsView />}
            {activeView === "dashboard" && <ProviderDashboard />}
            {activeView === "advanced" && <AdvancedProviderDashboard />}
            {activeView === "profile" && <ProfileView />}
            {activeView === "notifications" && <NotificationCenter />}
            {activeView === "loyalty" && <LoyaltyProgram />}
            {activeView === "admin" && adminUser && <AdminDashboard />}
            {activeView === "provider-page" && selectedProviderId && (
              <ProviderServicePage 
                providerId={selectedProviderId}
                onBack={() => {
                  setActiveView("dashboard");
                  setSelectedProviderId(null);
                }}
              />
            )}
            {activeView === "services-management" && selectedProviderId && (
              <ServicesManagementPage 
                providerId={selectedProviderId}
                onBack={() => {
                  setActiveView("dashboard");
                  setSelectedProviderId(null);
                }}
              />
            )}
            {activeView === "register-provider" && (
              <ProviderRegistration
                onSuccess={() => {
                  setActiveView("dashboard");
                }}
                onCancel={() => {
                  setActiveView("providers");
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
