export const CITIES_VI = [
    'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'An Giang', 
    'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre', 
    'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 
    'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 
    'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình', 
    'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 
    'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 
    'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 
    'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 
    'Thái Nguyên', 'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 
    'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái'
];

export const CITIES_EN = [
    'Hanoi', 'Ho Chi Minh City', 'Da Nang', 'Hai Phong', 'Can Tho', 'An Giang', 
    'Ba Ria - Vung Tau', 'Bac Giang', 'Bac Kan', 'Bac Lieu', 'Bac Ninh', 'Ben Tre', 
    'Binh Dinh', 'Binh Duong', 'Binh Phuoc', 'Binh Thuan', 'Ca Mau', 'Cao Bang', 
    'Dak Lak', 'Dak Nong', 'Dien Bien', 'Dong Nai', 'Dong Thap', 'Gia Lai', 
    'Ha Giang', 'Ha Nam', 'Ha Tinh', 'Hai Duong', 'Hau Giang', 'Hoa Binh', 
    'Hung Yen', 'Khanh Hoa', 'Kien Giang', 'Kon Tum', 'Lai Chau', 'Lam Dong', 
    'Lang Son', 'Lao Cai', 'Long An', 'Nam Dinh', 'Nghe An', 'Ninh Binh', 
    'Ninh Thuan', 'Phu Tho', 'Phu Yen', 'Quang Binh', 'Quang Nam', 'Quang Ngai', 
    'Quang Ninh', 'Quang Tri', 'Soc Trang', 'Son La', 'Tay Ninh', 'Thai Binh', 
    'Thai Nguyen', 'Thanh Hoa', 'Thua Thien Hue', 'Tien Giang', 'Tra Vinh', 
    'Tuyen Quang', 'Vinh Long', 'Vinh Phuc', 'Yen Bai'
];

export const translateCityToVi = (city: string) => {
    if (!city) return city;
    const index = CITIES_EN.indexOf(city);
    if (index !== -1) return CITIES_VI[index];
    return city;
};

export const translateCityToEn = (city: string) => {
    if (!city) return city;
    const index = CITIES_VI.indexOf(city);
    if (index !== -1) return CITIES_EN[index];
    return city;
};

export const getLocalizedCity = (city: string, lang: string) => {
    if (!city) return city;
    if (lang === 'en') {
        return translateCityToEn(city);
    }
    return translateCityToVi(city);
};
