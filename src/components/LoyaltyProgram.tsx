import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const rewards = [
  { icon: "🎁", title: "خصم 10%", description: "خصم على الخدمة التالية", points: 100 },
  { icon: "💆", title: "خدمة مجانية", description: "خدمة أساسية مجانية", points: 300 },
  { icon: "🌟", title: "خصم 25%", description: "خصم كبير على أي خدمة", points: 500 },
  { icon: "👑", title: "عضوية VIP", description: "عضوية مميزة لشهر كامل", points: 1000 },
];

const getTierInfo = (tier: string) => {
  const tiers = {
    "برونزي": { name: "برونزي", pointsNeeded: 500, color: "bg-orange-100 text-orange-800" },
    "فضي": { name: "فضي", pointsNeeded: 1000, color: "bg-gray-100 text-gray-800" },
    "ذهبي": { name: "ذهبي", pointsNeeded: 0, color: "bg-yellow-100 text-yellow-800" },
  };
  return tiers[tier as keyof typeof tiers] || tiers["برونزي"];
};

export function LoyaltyProgram() {
  const loyalty = useQuery(api.loyalty.getUserLoyalty);
  const initializeLoyalty = useMutation(api.loyalty.initializeLoyalty);
  const redeemPoints = useMutation(api.loyalty.redeemPoints);

  const handleInitialize = async () => {
    try {
      await initializeLoyalty();
      toast.success("تم تفعيل برنامج الولاء بنجاح!");
    } catch (error) {
      toast.error("حدث خطأ في تفعيل برنامج الولاء");
    }
  };

  const handleRedeem = async (reward: any) => {
    const points = reward.points;
    try {
      await redeemPoints({ points, reason: `استبدال: ${reward.title}` });
      toast.success(`تم استبدال ${points} نقطة بنجاح!`);
    } catch (error) {
      toast.error("حدث خطأ في استبدال النقاط");
    }
  };

  if (!loyalty) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎁</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            مرحباً ببرنامج الولاء
          </h3>
          <p className="text-gray-500 mb-6">
            اكسب نقاط مع كل حجز واستبدلها بمكافآت رائعة
          </p>
        </div>
        
        <button
          onClick={handleInitialize}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
        >
          تفعيل برنامج الولاء
        </button>
      </div>
    );
  }

  const tierInfo = getTierInfo(loyalty.currentTier);
  const progressPercentage = tierInfo.pointsNeeded > 0 
    ? Math.min((loyalty.totalPoints / tierInfo.pointsNeeded) * 100, 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* نقاط الولاء */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold">{loyalty.totalPoints} نقطة</h2>
            <p className="text-purple-100">رصيد النقاط الحالي</p>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-medium">
              {tierInfo.name}
            </div>
            {tierInfo.pointsNeeded > 0 && (
              <p className="text-sm text-purple-100 mt-1">
                <span>{tierInfo.pointsNeeded - loyalty.totalPoints} نقطة متبقية</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
          <div 
            className="bg-white h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-2xl font-bold text-blue-600">{loyalty.totalBookings}</p>
          <p className="text-gray-600">إجمالي الحجوزات</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-2xl font-bold text-green-600">{loyalty.totalSpent} د.أ</p>
          <p className="text-gray-600">إجمالي المبلغ المنفق</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-2xl font-bold text-purple-600">{loyalty.pointsHistory?.length || 0}</p>
          <p className="text-gray-600">عدد المعاملات</p>
        </div>
      </div>

      {/* المكافآت المتاحة */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">المكافآت المتاحة</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rewards.map((reward, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="text-center mb-3">
                <span className="text-2xl">{reward.icon}</span>
                <h4 className="font-medium text-gray-900">{reward.title}</h4>
                <p className="text-sm text-gray-600">{reward.description}</p>
              </div>
              <div className="text-center">
                <span className="text-purple-600 font-bold">{reward.points} نقطة</span>
                <button
                  onClick={() => handleRedeem(reward)}
                  disabled={loyalty.totalPoints < reward.points}
                  className={`block w-full mt-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    loyalty.totalPoints >= reward.points
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {loyalty.totalPoints >= reward.points ? "استبدال" : "نقاط غير كافية"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* تاريخ النقاط */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">تاريخ النقاط</h3>
        <div className="space-y-3">
          {loyalty.pointsHistory && loyalty.pointsHistory.length > 0 ? (
            loyalty.pointsHistory.slice(-10).reverse().map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{entry.reason}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.date).toLocaleDateString('ar-JO')}
                  </p>
                </div>
                <span className={`font-bold ${
                  entry.type === 'earned' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {entry.type === 'earned' ? '+' : '-'}{entry.points} نقطة
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">لا يوجد تاريخ نقاط بعد</p>
          )}
        </div>
      </div>
    </div>
  );
}
