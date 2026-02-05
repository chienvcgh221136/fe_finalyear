export interface VipData {
    isActive: boolean;
    vipType: string;
    priorityScore: number;
    packageId?: string;
    startedAt: string | null;
    expiredAt: string | null;
}

export interface User {
    id: string; // or _id depending on backend
    _id?: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    role?: 'ADMIN' | 'USER';
    isBanned?: boolean;
    createdAt?: string;
    rating?: number;
    totalReviews?: number;
    vip?: VipData;
    wallet?: {
        balance: number;
    };
    isAuthenticated?: boolean;
}

export interface Review {
    _id: string;
    buyerId: User | string;
    sellerId: User | string;
    postId: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface Address {
    street?: string;
    ward?: string;
    district: string;
    city: string;
}

export interface Post {
    _id: string;
    userId: User | string;
    title: string;
    description: string;
    transactionType: 'SALE' | 'RENT';
    propertyType: 'APARTMENT' | 'HOUSE' | 'LAND' | 'OFFICE' | 'SHOPHOUSE';
    apartmentType?: 'MINI' | 'DORM' | 'SERVICED' | 'STUDIO' | 'OFFICETEL' | 'PENTHOUSE' | 'DUPLEX' | 'HIGH_END';
    price: number;
    deposit?: number;
    area: number;
    address: Address;
    bedrooms?: number;
    bathrooms?: number;
    floor?: number;
    totalFloors?: number;
    furniture?: 'NONE' | 'BASIC' | 'FULL';
    images: string[];
    redbookImages?: string[];
    status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SOLD';
    rejectReason?: string;
    vip?: VipData;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
}

export interface ChatRoom {
    _id: string;
    postId: string | Post;
    userIds: (string | User)[];
    lastMessage: string;
    lastMessageAt: string;
    unreadCount?: number;
    nicknames?: Record<string, string>;
}

export interface MessageItem {
    _id?: string;
    senderId: string | User;
    content: string;
    type?: 'TEXT' | 'IMAGE';
    isRead: boolean;
    createdAt: string;
}

export interface MessageData {
    _id: string;
    chatRoomId: string | ChatRoom;
    messages: MessageItem[];
    createdAt: string;
    updatedAt: string;
}
// Wallet & VIP Types
export interface Wallet {
    balance: number;
    totalTopup: number;
    totalSpent: number;
    totalWithdrawn: number;
    updatedAt: string;
}

export interface Transaction {
    _id: string;
    userId: string;
    type: 'TOPUP' | 'VIP_PURCHASE' | 'POST_FEE';
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
}

export interface VipPackage {
    _id: string;
    name: string;
    price: number;
    durationDays: number;
    priorityScore: number;
    description: string;
    isActive: boolean;
    limitViewPhone?: number;
    perks?: string[];
    isPopular?: boolean;
}

export interface UserStats {
    totalPosts: number;
    activePosts: number;
    soldPosts: number;
    totalViews: number;
    totalLeads: number;
    vipPosts: number;
    totalSpent: number;
    chartData: {
        name: string;
        views: number;
        leads: number;
        posts: number;
    }[];
}





