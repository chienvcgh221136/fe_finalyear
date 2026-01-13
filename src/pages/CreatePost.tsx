import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsAPI } from '../services/api';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Upload, X, Plus, Link as LinkIcon, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Using standard HTML elements with Tailwind
const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
        {children}
    </label>
);

const propertyTypes = [
    { value: 'APARTMENT', label: 'Căn hộ' },
    { value: 'HOUSE', label: 'Nhà riêng' },
    { value: 'LAND', label: 'Đất nền' },
    { value: 'OFFICE', label: 'Văn phòng' },
    { value: 'SHOPHOUSE', label: 'Shophouse' },
];

const cities = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Bình Dương',
    'Đồng Nai',
    'Khánh Hòa',
];

const CreatePost = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const isEditMode = !!editId;

    const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm();
    const transactionType = watch('transactionType');

    // Image URL Input State (Main Images)
    const [images, setImages] = useState<string[]>([]);
    const [currentImageUrl, setCurrentImageUrl] = useState('');

    // Redbook Image URL Input State (Sổ đỏ)
    const [redbookImages, setRedbookImages] = useState<string[]>([]);
    const [currentRedbookUrl, setCurrentRedbookUrl] = useState('');

    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const queryClient = useQueryClient();

    // Fetch Post Data for Edit Mode
    const { data: postData } = useQuery({
        queryKey: ['post', editId],
        queryFn: () => postsAPI.getById(editId!),
        enabled: isEditMode,
    });

    // Populate form when data is available
    useEffect(() => {
        if (isEditMode && postData?.data?.data && !watch('title')) {
            const data = postData.data.data;
            setValue('title', data.title);
            setValue('description', data.description);
            setValue('price', data.price);
            setValue('area', data.area);

            // Nested Address
            if (data.address) {
                setValue('city', data.address.city);
                setValue('district', data.address.district);
                setValue('ward', data.address.ward);
                setValue('street', data.address.street);
            } else {
                // Fallback for old data if any
                setValue('city', data.city);
                setValue('district', data.district);
                setValue('address', data.address); // Old detailed address
            }

            setValue('bedrooms', data.bedrooms);
            setValue('bathrooms', data.bathrooms);
            setValue('floor', data.floor);
            setValue('totalFloors', data.totalFloors);
            setValue('transactionType', data.transactionType);
            setValue('propertyType', data.propertyType || data.type);
            setValue('apartmentType', data.apartmentType);
            setValue('furniture', data.furniture);

            if (data.images && images.length === 0) setImages(data.images);
            if (data.redbookImages && redbookImages.length === 0) setRedbookImages(data.redbookImages);
        }
    }, [isEditMode, postData, setValue, setImages, setRedbookImages, watch, images.length, redbookImages.length]);


    const createMutation = useMutation({
        mutationFn: (data: any) => isEditMode ? postsAPI.update(editId!, data) : postsAPI.create(data),
        onSuccess: () => {
            setSuccessMsg(isEditMode ? 'Cập nhật tin thành công! ' : 'Đăng tin thành công! Tin của bạn đang chờ duyệt.');
            setErrorMsg('');
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setTimeout(() => {
                navigate('/profile?tab=posts');
            }, 1000);
        },
        onError: (error: any) => {
            setErrorMsg(error.response?.data?.message || 'Có lỗi xảy ra');
        }
    });

    // Helper for adding images
    const handleAddImage = (
        url: string,
        setUrl: (s: string) => void,
        list: string[],
        setList: (l: string[]) => void,
        limit: number = 10
    ) => {
        if (!url.trim()) return;
        try {
            new URL(url);
        } catch (_) {
            setErrorMsg('Link ảnh không hợp lệ');
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }
        if (list.length >= limit) {
            setErrorMsg(`Tối đa ${limit} ảnh`);
            return;
        }
        setList([...list, url]);
        setUrl('');
    };

    const handleRemoveImage = (index: number, list: string[], setList: (l: string[]) => void) => {
        setList(list.filter((_, i) => i !== index));
    };

    const onSubmit = (data: any) => {
        setSuccessMsg('');
        setErrorMsg('');

        if (images.length === 0) {
            setErrorMsg('Vui lòng thêm ít nhất 1 ảnh BĐS');
            return;
        }

        const payload = {
            ...data,
            price: Number(data.price),
            area: Number(data.area),
            bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
            bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
            floor: data.floor ? Number(data.floor) : undefined,
            totalFloors: data.totalFloors ? Number(data.totalFloors) : undefined,
            images: images,
            redbookImages: redbookImages, // standardized name
            legalImages: redbookImages, // keep for backward compatibility if needed, or remove if backend updated

            // Construct Nested Address
            address: {
                city: data.city,
                district: data.district,
                ward: data.ward || '',
                street: data.street || ''
            },

            // Clean up flat address fields
            city: undefined,
            district: undefined,
            ward: undefined,
            street: undefined
        };

        createMutation.mutate(payload);
    };

    // Helper to format price
    const formatPrice = (price: number) => {
        if (!price) return '';
        if (price >= 1000000000) {
            return (price / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ';
        }
        if (price >= 1000) {
            // If larger than million, show million logic, else maybe just show formatted number?
            // User asked for "tỷ, triệu, nghìn".
            if (price >= 1000000) {
                const millions = price / 1000000;
                if (millions >= 1000) { // 1000 million is 1 billion, handled above, but technically should flow here if I didn't return.
                    return millions.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' triệu';
                }
                return millions.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' triệu';
            }
            return (price / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' nghìn';
        }
        return price.toLocaleString('vi-VN') + ' đ';
    };

    const priceValue = watch('price');

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            {/* Notifications */}
            {successMsg && (
                <div className="fixed top-20 right-5 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg flex items-center gap-2">
                    <span>✓</span> {successMsg}
                </div>
            )}
            {errorMsg && (
                <div className="fixed top-20 right-5 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg flex items-center gap-2">
                    <span>⚠</span> {errorMsg}
                </div>
            )}

            <div className="container max-w-3xl mx-auto px-4">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
                    <h1 className="mb-6 text-2xl font-bold text-gray-900">Đăng tin mới</h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h2 className="font-semibold text-gray-900 border-b pb-2">Thông tin cơ bản</h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Loại giao dịch *</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...register('transactionType', { required: 'Vui lòng chọn loại giao dịch' })}
                                    >
                                        <option value="">Chọn loại</option>
                                        <option value="SALE">Bán</option>
                                        <option value="RENT">Cho thuê</option>
                                    </select>
                                    {errors.transactionType && <p className="text-xs text-red-500">{errors.transactionType.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Loại BĐS *</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...register('propertyType', { required: 'Vui lòng chọn loại BĐS' })}
                                    >
                                        <option value="">Chọn loại</option>
                                        {propertyTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                    {errors.propertyType && <p className="text-xs text-red-500">{errors.propertyType.message as string}</p>}
                                </div>
                            </div>

                            {watch('propertyType') === 'APARTMENT' && (
                                <div className="space-y-2">
                                    <Label>Loại căn hộ</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        {...register('apartmentType')}
                                    >
                                        <option value="">Chọn loại căn hộ</option>
                                        <option value="MINI">Chung cư mini</option>
                                        <option value="DORM">Kí túc xá</option>
                                        <option value="SERVICED">Căn hộ dịch vụ</option>
                                        <option value="STUDIO">Studio</option>
                                        <option value="OFFICETEL">Officetel</option>
                                        <option value="PENTHOUSE">Penthouse</option>
                                        <option value="DUPLEX">Duplex</option>
                                        <option value="HIGH_END">Cao cấp</option>
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Tiêu đề *</Label>
                                <Input
                                    placeholder="VD: Bán căn hộ 2PN Vinhomes Central Park, view sông"
                                    {...register('title', {
                                        required: 'Tiêu đề là bắt buộc',
                                        minLength: { value: 10, message: 'Tiêu đề tối thiểu 10 ký tự' },
                                        maxLength: { value: 200, message: 'Tiêu đề tối đa 200 ký tự' }
                                    })}
                                />
                                {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Mô tả chi tiết *</Label>
                                <Textarea
                                    placeholder="Mô tả chi tiết về bất động sản..."
                                    rows={6}
                                    {...register('description', {
                                        required: 'Mô tả là bắt buộc',
                                        minLength: { value: 50, message: 'Mô tả tối thiểu 50 ký tự' },
                                        maxLength: { value: 5000, message: 'Mô tả tối đa 5000 ký tự' }
                                    })}
                                />
                                {errors.description && <p className="text-xs text-red-500">{errors.description.message as string}</p>}
                            </div>
                        </div>

                        {/* Price & Area */}
                        <div className="space-y-4">
                            <h2 className="font-semibold text-gray-900 border-b pb-2">Đặc điểm bất động sản</h2>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Giá (VNĐ) *</Label>
                                    <Controller
                                        control={control}
                                        name="price"
                                        rules={{
                                            required: 'Giá là bắt buộc',
                                            min: { value: 0, message: 'Giá phải lớn hơn 0' }
                                        }}
                                        render={({ field: { onChange, value, ...rest } }) => (
                                            <Input
                                                {...rest}
                                                type="text"
                                                placeholder="5.000.000.000"
                                                value={value ? Number(value).toLocaleString('vi-VN') : ''}
                                                onChange={(e) => {
                                                    const rawValue = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
                                                    onChange(rawValue);
                                                }}
                                            />
                                        )}
                                    />
                                    {priceValue && (
                                        <div className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                                            {formatPrice(Number(priceValue))}
                                        </div>
                                    )}
                                    {errors.price && <p className="text-xs text-red-500">{errors.price.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Diện tích (m²) *</Label>
                                    <Input
                                        type="number"
                                        placeholder="80"
                                        {...register('area', {
                                            required: 'Diện tích là bắt buộc',
                                            min: { value: 0, message: 'Diện tích phải lớn hơn 0' }
                                        })}
                                    />
                                    {errors.area && <p className="text-xs text-red-500">{errors.area.message as string}</p>}
                                </div>
                            </div>

                            {/* Additional Info (Conditional based purely on property type logic, but usually always relevant for houses/apartments) */}
                            <div className="grid gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Phòng ngủ</Label>
                                    <Input type="number" placeholder="2" {...register('bedrooms')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phòng tắm</Label>
                                    <Input type="number" placeholder="2" {...register('bathrooms')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tầng số</Label>
                                    <Input type="number" placeholder="5" {...register('floor')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tổng số tầng</Label>
                                    <Input type="number" placeholder="20" {...register('totalFloors')} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Nội thất</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('furniture')}
                                >
                                    <option value="">Chọn tình trạng</option>
                                    <option value="FULL">Đầy đủ</option>
                                    <option value="BASIC">Cơ bản</option>
                                    <option value="NONE">Không nội thất</option>
                                </select>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label>Thành phố *</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                {...register('city', { required: 'Vui lòng chọn thành phố' })}
                            >
                                <option value="">Chọn thành phố</option>
                                {cities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            {errors.city && <p className="text-xs text-red-500">{errors.city.message as string}</p>}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Quận/Huyện *</Label>
                                <Input
                                    placeholder="Quận 1"
                                    {...register('district', { required: 'Vui lòng nhập quận/huyện' })}
                                />
                                {errors.district && <p className="text-xs text-red-500">{errors.district.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Phường/Xã</Label>
                                <Input
                                    placeholder="Phường Bến Nghé"
                                    {...register('ward')}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tên đường / Số nhà *</Label>
                            <Input
                                placeholder="Số 123, Đường Nguyễn Huệ"
                                {...register('street', { required: 'Vui lòng nhập tên đường' })}
                            />
                            {errors.street && <p className="text-xs text-red-500">{errors.street.message as string}</p>}
                        </div>

                        {/* Images (URL Input) */}
                        <div className="space-y-4">
                            <h2 className="font-semibold text-gray-900 border-b pb-2">Hình ảnh BĐS</h2>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder="Nhập link ảnh (VD: https://cl.com/pic.jpg)"
                                        value={currentImageUrl}
                                        onChange={(e) => setCurrentImageUrl(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Button type="button" onClick={() => handleAddImage(currentImageUrl, setCurrentImageUrl, images, setImages)} variant="secondary">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Thêm ảnh
                                </Button>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                {images.map((url, index) => (
                                    <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                                        <img src={url} alt={`Preview ${index}`} className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index, images, setImages)}
                                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500">Tối đa 10 ảnh.</p>
                        </div>

                        {/* Redbook Images (Conditional for SALE) */}
                        {transactionType === 'SALE' && (
                            <div className="space-y-4 bg-red-50 p-4 rounded-lg border border-red-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-5 w-5 text-red-600" />
                                    <h2 className="font-semibold text-red-800">Thông tin pháp lỹ (Sổ đỏ/Sổ hồng)</h2>
                                </div>
                                <p className="text-sm text-red-600 mb-4">Cung cấp hình ảnh sổ đỏ giúp tin đăng uy tín hơn.</p>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder="Nhập link ảnh sổ đỏ..."
                                            value={currentRedbookUrl}
                                            onChange={(e) => setCurrentRedbookUrl(e.target.value)}
                                            className="pl-9 bg-white"
                                        />
                                    </div>
                                    <Button type="button" onClick={() => handleAddImage(currentRedbookUrl, setCurrentRedbookUrl, redbookImages, setRedbookImages, 5)} variant="secondary" className="bg-white hover:bg-gray-50">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Thêm ảnh
                                    </Button>
                                </div>

                                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                                    {redbookImages.map((url, index) => (
                                        <div key={index} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-white">
                                            <img src={url} alt={`Redbook ${index}`} className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index, redbookImages, setRedbookImages)}
                                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <Button type="submit" size="lg" disabled={createMutation.isPending} className="flex-1 md:flex-none">
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Upload className="mr-2 h-4 w-4" />
                                Đăng tin
                            </Button>
                            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} className="flex-1 md:flex-none">
                                Hủy
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
