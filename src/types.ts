export interface User {
    id: string; // or _id depending on backend
    _id?: string;
    name: string;
    email: string;
    phone?: string; // Corrected to match backend field 'phone'
    avatar?: string;
    role?: 'ADMIN' | 'USER';
    createdAt?: string;
}
