import { useState } from 'react';
import { Phone, MessageCircle, AlertCircle, CheckCircle, Star } from 'lucide-react';

interface AgentWidgetProps {
    user?: {
        name: string;
        avatar?: string;
        phoneNumber?: string;
        email?: string;
        _id?: string;
        createdAt?: string; // Add createdAt for Member Since
        rating?: number;    // Add dynamic rating
        reviewCount?: number; // Add dynamic review count
    };
    updatedAt?: string; // Keeping for backward compatibility if needed, but preferring user.createdAt
}

const AgentWidget = ({ user, updatedAt }: AgentWidgetProps) => {
    // Generate member since date from USER data
    const memberSince = user?.createdAt
        ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
        : (updatedAt ? new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Unknown');

    const userName = user?.name || "Unverified User";
    const firstLetter = userName.charAt(0).toUpperCase();

    const [showPhone, setShowPhone] = useState(false);
    const phoneNumber = user?.phoneNumber || "0909 123 ***";

    const handleShowPhone = () => {
        setShowPhone(true);
    };

    // Dynamic values for rating - default to hidden or 0 if not present
    const rating = user?.rating || 0;
    const reviewCount = user?.reviewCount || 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full mb-6">

            {/* Header Label */}
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-6">
                LISTED BY AGENT
            </div>

            {/* Profile Section */}
            <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                    <div className="p-0.5 rounded-full border-2 border-blue-100">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt="Agent"
                                className="w-14 h-14 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-2xl font-bold uppercase">
                                {firstLetter}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-col pt-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-bold text-gray-900 text-lg leading-none truncate">{userName}</h3>
                        <CheckCircle size={16} className="text-blue-600 fill-blue-600 text-white flex-shrink-0" />
                    </div>

                    {/* Show rating if it exists in data */}
                    {(user?.rating !== undefined && user?.rating !== null) ? (
                        <div className="flex items-center gap-2 text-sm mb-1">
                            <div className="flex items-center gap-1">
                                <Star size={14} className="text-orange-500 fill-orange-500" />
                                <span className="font-bold text-orange-500">{user.rating}</span>
                            </div>
                            <span className="text-gray-400 text-xs">({user.reviewCount || 0} Reviews)</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 text-sm mb-1 text-gray-500">
                            <Star size={14} className="text-gray-300" />
                            <span className="text-xs">No rating</span>
                        </div>
                    )}

                    <p className="text-gray-500 text-xs">Member since {memberSince}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-8">
                <button
                    onClick={handleShowPhone}
                    className={`w-full font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2.5 transition-all shadow-sm ${showPhone
                        ? 'bg-white border-2 border-blue-600 text-blue-600'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                >
                    <Phone size={20} className={showPhone ? "text-blue-600" : "fill-current"} />
                    <span>
                        {showPhone ? phoneNumber : 'Show Phone Number'}
                    </span>
                    {!showPhone && <span className="text-xs opacity-80 font-normal ml-auto hidden sm:inline-block">Press to reveal</span>}
                </button>

                <button className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2.5 transition-colors">
                    <MessageCircle size={20} />
                    <span>Start Chat</span>
                </button>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 pt-6 text-center">
                <button className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors">
                    <AlertCircle size={18} />
                    <span>Report this listing</span>
                </button>
            </div>

        </div>
    );
};

export default AgentWidget;
