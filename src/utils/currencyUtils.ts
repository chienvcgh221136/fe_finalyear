import i18n from '../i18n';

export const formatVND = (amount: number) => {
    const lng = i18n.language || 'vi';
    const locale = lng === 'vi' ? 'vi-VN' : 'en-US';
    const formatted = new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0
    }).format(amount);
    return `${formatted} ${lng === 'vi' ? 'đ' : 'VND'}`;
};

export const formatVNDRaw = (amount: number) => {
    const lng = i18n.language || 'vi';
    const locale = lng === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 0
    }).format(amount);
};
