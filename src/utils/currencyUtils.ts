export const formatVND = (amount: number) => {
    const formatted = new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 0
    }).format(amount);
    return `${formatted} VND`;
};

export const formatVNDRaw = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
        maximumFractionDigits: 0
    }).format(amount);
};
