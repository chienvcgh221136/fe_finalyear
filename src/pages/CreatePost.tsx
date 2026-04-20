import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsAPI, filesAPI } from '../services/api';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Upload, X, Plus, Link as LinkIcon, FileText, Info, Tag, MapPin, Image as ImageIcon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { CITIES_VI, CITIES_EN, getLocalizedCity, translateCityToVi } from '../utils/cityTranslations';

// Using standard HTML elements with Tailwind for clear form inputs
const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className={`flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 ${className || ''}`} {...props} />
);

const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea className={`flex min-h-[120px] w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400 ${className || ''}`} {...props} />
);

const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className={`mb-2 block text-sm font-semibold text-gray-800 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`} {...props}>
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

// Cities imported from cityTranslations

const CreatePost = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
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
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadingRedbook, setIsUploadingRedbook] = useState(false);

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
                setValue('city', getLocalizedCity(data.address.city, i18n.language));
                setValue('district', data.address.district);
                setValue('ward', data.address.ward);
                setValue('street', data.address.street);
            } else {
                // Fallback for old data if any
                // Localize city to current language
                setValue('city', getLocalizedCity(data.city, i18n.language));
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
    }, [isEditMode, postData, setValue, setImages, setRedbookImages, watch, images.length, redbookImages.length, i18n.language]);


    const createMutation = useMutation({
        mutationFn: (data: any) => isEditMode ? postsAPI.update(editId!, data) : postsAPI.create(data),
        onSuccess: () => {
            setSuccessMsg(isEditMode ? t('create_post.success_update_msg') : t('create_post.success_msg'));
            setErrorMsg('');
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            setTimeout(() => {
                navigate('/profile?tab=posts');
            }, 1000);
        },
        onError: (error: any) => {
            setErrorMsg(error.response?.data?.message || t('common.error_occurred'));
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
            setErrorMsg(t('create_post.error_invalid_link'));
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }
        
        // Require Cloudinary URLs
        if (!url.toLowerCase().includes('cloudinary.com')) {
            setErrorMsg(t('common.cloudinary_required'));
            setTimeout(() => setErrorMsg(''), 3000);
            return;
        }

        if (list.length >= limit) {
            setErrorMsg(t('create_post.error_max_limit', { limit }));
            return;
        }
        setList([...list, url]);
        setUrl('');
    };

    const handleRemoveImage = (index: number, list: string[], setList: (l: string[]) => void) => {
        setList(list.filter((_, i) => i !== index));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isRedbook = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check if limit reached
        if (!isRedbook && images.length >= 10) {
            setErrorMsg(t('create_post.error_max_limit', { limit: 10 }));
            return;
        }
        if (isRedbook && redbookImages.length >= 5) {
            setErrorMsg(t('create_post.error_max_limit', { limit: 5 }));
            return;
        }

        if (isRedbook) setIsUploadingRedbook(true);
        else setIsUploading(true);

        try {
            const res = await filesAPI.upload(file);
            const url = res.data.url;
            if (isRedbook) setRedbookImages([...redbookImages, url]);
            else setImages([...images, url]);
        } catch (err: any) {
            console.error("Upload failed", err);
            setErrorMsg(err.response?.data?.message || t('common.upload_failed', 'Tải ảnh thất bại'));
            setTimeout(() => setErrorMsg(''), 3000);
        } finally {
            if (isRedbook) setIsUploadingRedbook(false);
            else setIsUploading(false);
            // Reset input so the same file can be uploaded again if needed
            e.target.value = '';
        }
    };

    const onSubmit = (data: any) => {
        setSuccessMsg('');
        setErrorMsg('');

        if (images.length === 0) {
            setErrorMsg(t('create_post.error_min_image'));
            return;
        }

        // Map city back to Vietnamese standard before submitting
        const cityToSubmit = translateCityToVi(data.city);

        const payload = {
            ...data,
            price: Number(data.price),
            area: Number(data.area),
            bedrooms: data.bedrooms ? Number(data.bedrooms) : undefined,
            bathrooms: data.bathrooms ? Number(data.bathrooms) : undefined,
            floor: data.floor ? Number(data.floor) : undefined,
            totalFloors: data.totalFloors ? Number(data.totalFloors) : undefined,
            transactionType: data.transactionType,
            propertyType: data.propertyType,
            apartmentType: data.apartmentType || undefined,
            furniture: data.furniture || undefined,
            images: images,
            redbookImages: redbookImages,
            legalImages: redbookImages,

            // Construct Nested Address
            address: {
                city: cityToSubmit,
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
        const locale = i18n.language === 'vi' ? 'vi-VN' : 'en-US';
        if (price >= 1000000000) {
            return (price / 1000000000).toLocaleString(locale, { maximumFractionDigits: 2 }) + ' ' + t('common.billion');
        }
        if (price >= 1000000) {
            return (price / 1000000).toLocaleString(locale, { maximumFractionDigits: 2 }) + ' ' + t('common.million');
        }
        if (price >= 1000) {
            return (price / 1000).toLocaleString(locale, { maximumFractionDigits: 2 }) + ' ' + t('common.thousand');
        }
        return price.toLocaleString(locale) + ' ' + t('common.currency');
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
                    <h1 className="mb-8 text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 drop-shadow-sm">{t('create_post.title')}</h1>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8" noValidate>
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
                                <div className="bg-blue-100 p-2 rounded-xl text-blue-600 shadow-sm border border-blue-200">
                                    <Info className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{t('create_post.basic_info')}</h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('create_post.transaction_type')}</Label>
                                    <select
                                        className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400"
                                        {...register('transactionType', { required: t('create_post.req_transaction_type') })}
                                    >
                                        <option value="">{t('create_post.select_type')}</option>
                                        <option value="SALE">{t('create_post.sale')}</option>
                                        <option value="RENT">{t('create_post.rent')}</option>
                                    </select>
                                    {errors.transactionType && <p className="text-xs text-red-500">{errors.transactionType.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>{t('create_post.property_type')}</Label>
                                    <select
                                        className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400"
                                        {...register('propertyType', { required: t('create_post.req_property_type') })}
                                    >
                                        <option value="">{t('create_post.select_type')}</option>
                                        {propertyTypes.map((type) => (
                                            <option key={type.value} value={type.value}>{t('search_page.property_type_' + type.value, { defaultValue: type.label })}</option>
                                        ))}
                                    </select>
                                    {errors.propertyType && <p className="text-xs text-red-500">{errors.propertyType.message as string}</p>}
                                </div>
                            </div>

                            {watch('propertyType') === 'APARTMENT' && (
                                <div className="space-y-2">
                                    <Label>{t('create_post.apartment_type')}</Label>
                                    <select
                                        className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400"
                                        {...register('apartmentType')}
                                    >
                                        <option value="">{t('create_post.select_apartment_type')}</option>
                                        <option value="MINI">{t('create_post.mini_apartment')}</option>
                                        <option value="DORM">{t('create_post.dormitory')}</option>
                                        <option value="SERVICED">{t('create_post.serviced_apartment')}</option>
                                        <option value="STUDIO">{t('create_post.studio')}</option>
                                        <option value="OFFICETEL">{t('create_post.officetel')}</option>
                                        <option value="PENTHOUSE">{t('create_post.penthouse')}</option>
                                        <option value="DUPLEX">{t('create_post.duplex')}</option>
                                        <option value="HIGH_END">{t('create_post.high_end')}</option>
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>{t('create_post.post_title')}</Label>
                                <Input
                                    placeholder={t('create_post.post_title_placeholder')}
                                    {...register('title', {
                                        required: t('create_post.req_title'),
                                        minLength: { value: 10, message: t('create_post.err_title_min') },
                                        maxLength: { value: 200, message: t('create_post.err_title_max') }
                                    })}
                                />
                                {errors.title && <p className="text-xs text-red-500">{errors.title.message as string}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>{t('create_post.description')}</Label>
                                <Textarea
                                    placeholder={t('create_post.description_placeholder')}
                                    rows={6}
                                    {...register('description', {
                                        maxLength: { value: 5000, message: t('create_post.err_desc_max') }
                                    })}
                                />
                                {errors.description && <p className="text-xs text-red-500">{errors.description.message as string}</p>}
                            </div>
                        </div>

                        {/* Price & Area */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
                                <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600 shadow-sm border border-emerald-200">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{t('create_post.property_specs')}</h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('create_post.price')}</Label>
                                    <Controller
                                        control={control}
                                        name="price"
                                        rules={{
                                            required: t('create_post.req_price'),
                                            min: { value: 0, message: t('create_post.err_price_min') }
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
                                    <Label>{t('create_post.area')}</Label>
                                    <Input
                                        type="number"
                                        placeholder="80"
                                        {...register('area', {
                                            required: t('create_post.req_area'),
                                            min: { value: 0, message: t('create_post.err_area_min') }
                                        })}
                                    />
                                    {errors.area && <p className="text-xs text-red-500">{errors.area.message as string}</p>}
                                </div>
                            </div>

                            {/* Additional Info (Conditional based purely on property type logic) */}
                            {watch('propertyType') !== 'LAND' && (
                                <>
                                    <div className={`grid gap-4 ${watch('propertyType') === 'OFFICE' ? 'md:grid-cols-2' : 'md:grid-cols-4'}`}>
                                        {watch('propertyType') !== 'OFFICE' && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>{t('create_post.bedrooms')}</Label>
                                                    <Input type="number" min="0" placeholder="2" {...register('bedrooms', { min: { value: 0, message: t('common.invalid_number', { defaultValue: 'Số không hợp lệ' }) } })} />
                                                    {errors.bedrooms && <p className="text-xs text-red-500">{errors.bedrooms.message as string}</p>}
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>{t('create_post.bathrooms')}</Label>
                                                    <Input type="number" min="0" placeholder="2" {...register('bathrooms', { min: { value: 0, message: t('common.invalid_number', { defaultValue: 'Số không hợp lệ' }) } })} />
                                                    {errors.bathrooms && <p className="text-xs text-red-500">{errors.bathrooms.message as string}</p>}
                                                </div>
                                            </>
                                        )}
                                        <div className="space-y-2">
                                            <Label>{t('create_post.floor')}</Label>
                                            <Input type="number" min="0" placeholder="5" {...register('floor', { min: { value: 0, message: t('common.invalid_number', { defaultValue: 'Số không hợp lệ' }) } })} />
                                            {errors.floor && <p className="text-xs text-red-500">{errors.floor.message as string}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('create_post.total_floors')}</Label>
                                            <Input type="number" min="0" placeholder="20" {...register('totalFloors', { min: { value: 0, message: t('common.invalid_number', { defaultValue: 'Số không hợp lệ' }) } })} />
                                            {errors.totalFloors && <p className="text-xs text-red-500">{errors.totalFloors.message as string}</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>{t('create_post.furniture')}</Label>
                                        <select
                                            className="flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-base text-gray-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 hover:border-gray-400"
                                            {...register('furniture')}
                                        >
                                            <option value="">{t('create_post.select_furniture')}</option>
                                            <option value="FULL">{t('create_post.fully_furnished')}</option>
                                            <option value="BASIC">{t('create_post.basic_furnished')}</option>
                                            <option value="NONE">{t('create_post.unfurnished')}</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
                                <div className="bg-orange-100 p-2 rounded-xl text-orange-600 shadow-sm border border-orange-200">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{t('create_post.location', { defaultValue: 'Vị trí & Địa chỉ' })}</h2>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('create_post.city')}</Label>
                                <Input
                                    list="city-list"
                                    placeholder={t('create_post.select_city')}
                                    {...register('city', { required: t('create_post.req_city') })}
                                    autoComplete="off"
                                />
                                <datalist id="city-list">
                                    {(i18n.language === 'en' ? CITIES_EN : CITIES_VI).map((city) => (
                                        <option key={city} value={city} />
                                    ))}
                                </datalist>
                                {errors.city && <p className="text-xs text-red-500">{errors.city.message as string}</p>}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>{t('create_post.district')}</Label>
                                    <Input
                                        placeholder={t('create_post.district_placeholder')}
                                        {...register('district', { required: t('create_post.req_district') })}
                                    />
                                    {errors.district && <p className="text-xs text-red-500">{errors.district.message as string}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('create_post.ward')}</Label>
                                    <Input
                                        placeholder={t('create_post.ward_placeholder')}
                                        {...register('ward')}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{t('create_post.street')}</Label>
                                <Input
                                    placeholder={t('create_post.street_placeholder')}
                                    {...register('street', { required: t('create_post.req_street') })}
                                />
                                {errors.street && <p className="text-xs text-red-500">{errors.street.message as string}</p>}
                            </div>
                        </div>

                        {/* Images (URL Input) */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
                                <div className="bg-purple-100 p-2 rounded-xl text-purple-600 shadow-sm border border-purple-200">
                                    <ImageIcon className="w-5 h-5" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-800">{t('create_post.images')}</h2>
                            </div>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                    <Input
                                        placeholder={t('create_post.image_url_placeholder')}
                                        value={currentImageUrl}
                                        onChange={(e) => setCurrentImageUrl(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="button" onClick={() => handleAddImage(currentImageUrl, setCurrentImageUrl, images, setImages)} variant="secondary">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('create_post.add_image')}
                                </Button>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="property-image-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e)}
                                        disabled={isUploading}
                                    />
                                    <Button
                                        type="button"
                                        onClick={() => document.getElementById('property-image-upload')?.click()}
                                        variant="outline"
                                        disabled={isUploading}
                                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        {isUploading ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Upload className="mr-2 h-4 w-4" />
                                        )}
                                        {t('common.upload', 'Tải lên')}
                                    </Button>
                                </div>
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
                            <p className="text-xs text-gray-500">{t('create_post.max_images')}</p>
                        </div>

                        {/* Redbook Images (Conditional for SALE) */}
                        {transactionType === 'SALE' && (
                            <div className="space-y-4 bg-rose-50/50 p-5 rounded-2xl border border-rose-200 shadow-sm mt-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-rose-100 p-2.5 rounded-xl text-rose-600 shadow-sm border border-rose-200">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <h2 className="font-bold text-rose-800 text-lg">{t('create_post.legal_info')}</h2>
                                </div>
                                <p className="text-sm text-red-600 mb-4">{t('create_post.legal_info_sub')}</p>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                        <Input
                                            placeholder={t('create_post.redbook_placeholder')}
                                            value={currentRedbookUrl}
                                            onChange={(e) => setCurrentRedbookUrl(e.target.value)}
                                            className="pl-10 bg-white"
                                        />
                                    </div>
                                    <Button type="button" onClick={() => handleAddImage(currentRedbookUrl, setCurrentRedbookUrl, redbookImages, setRedbookImages, 5)} variant="secondary" className="bg-white hover:bg-gray-50">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('create_post.add_image')}
                                    </Button>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            id="redbook-image-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleFileUpload(e, true)}
                                            disabled={isUploadingRedbook}
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => document.getElementById('redbook-image-upload')?.click()}
                                            variant="outline"
                                            disabled={isUploadingRedbook}
                                            className="bg-white hover:bg-rose-50 border-rose-200 text-rose-600"
                                        >
                                            {isUploadingRedbook ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Upload className="mr-2 h-4 w-4" />
                                            )}
                                            {t('common.upload', 'Tải lên')}
                                        </Button>
                                    </div>
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
                        <div className="flex gap-4 pt-6 border-t border-gray-100 mt-8">
                            <Button type="submit" size="lg" disabled={createMutation.isPending} className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Upload className="mr-2 h-4 w-4" />
                                {t('create_post.submit')}
                            </Button>
                            <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)} className="flex-1 md:flex-none">
                                {t('create_post.cancel')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreatePost;
