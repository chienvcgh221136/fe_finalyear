export interface User {
    id: string; // or _id depending on backend
    _id?: string;
    name: string;
    email: string;
    phone?: string; // Corrected to match backend field 'phone'
    avatar?: string;
    role?: 'ADMIN' | 'USER';
    isBanned?: boolean;
    createdAt?: string;
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
    isVip: boolean;
    priorityScore: number;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface ChatRoom {
    _id: string;
    postId: string | Post;
    userIds: (string | User)[];
    lastMessage: string;
    lastMessageAt: string;
    createdAt: string;
    updatedAt: string;
    unreadCount?: number;
}

export interface MessageItem {
    senderId: string | User;
    content: string;
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
