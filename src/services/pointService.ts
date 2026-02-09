import axios from 'axios';

const API_URL = 'http://localhost:3000/api/points';

const getMyPoints = async () => {
    const response = await axios.get(`${API_URL}/me`, { withCredentials: true });
    return response.data;
};

const redeemReward = async (rewardKey: string) => {
    const response = await axios.post(`${API_URL}/redeem`, { rewardKey }, { withCredentials: true });
    return response.data;
};

const useItem = async (data: { itemKey: string, postId: string, quantity: number }) => {
    const response = await axios.post(`${API_URL}/use-item`, data, { withCredentials: true });
    return response.data;
};

const getVipItemsHistory = async () => {
    const response = await axios.get(`${API_URL}/vip-items-history`, { withCredentials: true });
    return response.data;
};

const getUsersWithPoints = async (params?: any) => {
    const response = await axios.get(`${API_URL}/admin/users-points`, { params, withCredentials: true });
    return response.data;
};

const adjustUserPoints = async (data: { userId: string, amount: number, description?: string }) => {
    const response = await axios.post(`${API_URL}/admin/adjust-points`, data, { withCredentials: true });
    return response.data;
};

const getRewards = async (isActive?: boolean) => {
    const response = await axios.get(`${API_URL}/rewards`, { params: { isActive }, withCredentials: true });
    return response.data;
};

const createReward = async (data: any) => {
    const response = await axios.post(`${API_URL}/admin/rewards`, data, { withCredentials: true });
    return response.data;
};

const updateReward = async (id: string, data: any) => {
    const response = await axios.put(`${API_URL}/admin/rewards/${id}`, data, { withCredentials: true });
    return response.data;
};

const deleteReward = async (id: string) => {
    const response = await axios.delete(`${API_URL}/admin/rewards/${id}`, { withCredentials: true });
    return response.data;
};

export const pointService = {
    getMyPoints,
    redeemReward,
    useItem,
    getVipItemsHistory,
    getUsersWithPoints,
    adjustUserPoints,
    getRewards,
    createReward,
    updateReward,
    deleteReward
};
