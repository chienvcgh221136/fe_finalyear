import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentAPI } from '../../services/api';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    postId: string;
    postTitle: string;
    postImage: string;
    postPrice: number;
    postAddress: string;
}

const HOURS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

const ScheduleModal = ({ isOpen, onClose, postId, postTitle, postImage, postPrice, postAddress }: ScheduleModalProps) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    // Generate next 14 days
    const dates = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    }, []);

    const [currentDateIndex, setCurrentDateIndex] = useState(0);
    const visibleDates = dates.slice(currentDateIndex, currentDateIndex + 5);

    const handleNextDates = () => {
        if (currentDateIndex + 5 < dates.length) setCurrentDateIndex(currentDateIndex + 1);
    };

    const handlePrevDates = () => {
        if (currentDateIndex > 0) setCurrentDateIndex(currentDateIndex - 1);
    };

    const queryClient = useQueryClient();

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime) {
            alert("Vui lòng chọn ngày và giờ xem nhà.");
            return;
        }

        try {
            setLoading(true);
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const appointmentDate = new Date(selectedDate);
            appointmentDate.setHours(hours, minutes, 0, 0);

            await appointmentAPI.create(postId, {
                appointmentTime: appointmentDate,
                note
            });

            alert("Đã gửi yêu cầu đặt lịch xem nhà thành công! Người bán sẽ xác nhận sớm.");
            queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] });
            onClose();
        } catch (error: any) {
            console.error("Booking error:", error);
            alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt lịch.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

                {/* Left Side: Property Summary */}
                <div className="w-full md:w-[35%] bg-gray-50 p-6 md:p-8 border-r border-gray-100 flex flex-col">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Thông tin bất động sản</h3>

                    <div className="rounded-2xl overflow-hidden mb-4 shadow-sm border border-gray-200 aspect-video bg-gray-200">
                        <img src={postImage} alt={postTitle} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 mb-6">
                        <p className="text-blue-600 font-bold text-xl">
                            {postPrice >= 1000000000
                                ? `${(postPrice / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} Tỷ`
                                : postPrice >= 1000000
                                    ? `${(postPrice / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Triệu`
                                    : `${postPrice.toLocaleString('vi-VN')} đ`
                            }
                        </p>
                        <h4 className="font-bold text-gray-900 text-lg line-clamp-2">{postTitle}</h4>
                        <div className="flex items-start gap-1 text-gray-500 text-sm mt-1">
                            <span className="shrink-0 mt-0.5">📍</span>
                            <span className="line-clamp-2">{postAddress}</span>
                        </div>
                    </div>
                </div>

                {/* Right Side: Schedule Form */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Đặt lịch xem nhà</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Date Selection */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800">Chọn ngày</h4>
                            <span className="text-sm font-medium text-gray-500">
                                {selectedDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="relative flex items-center">
                            <button onClick={handlePrevDates} disabled={currentDateIndex === 0} className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors">
                                <ChevronLeft size={20} />
                            </button>

                            <div className="flex-1 flex justify-between gap-2 overflow-hidden px-2">
                                {visibleDates.map((date) => {
                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all border ${isSelected
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                                                : 'bg-white text-gray-600 border-transparent hover:bg-gray-50'
                                                }`}
                                        >
                                            <span className="text-xs font-medium opacity-80 uppercase">
                                                {date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                                            </span>
                                            <span className="text-lg font-bold">
                                                {date.getDate()}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button onClick={handleNextDates} disabled={currentDateIndex + 5 >= dates.length} className="p-2 text-gray-400 hover:text-gray-800 disabled:opacity-30 transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div className="mb-8">
                        <h4 className="font-bold text-gray-800 mb-4">Chọn giờ</h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                            {HOURS.map((time) => (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-2 px-1 rounded-lg text-sm font-medium border transition-all ${selectedTime === time
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="mb-8">
                        <h4 className="font-bold text-gray-800 mb-2">Ghi chú thêm (Tùy chọn)</h4>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ví dụ: Tôi muốn xem nhà vào buổi sáng, vui lòng xác nhận trước..."
                            className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px] text-sm text-gray-700 placeholder:text-gray-400"
                        />
                    </div>

                    {/* Footer buttons */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 font-bold text-gray-500 hover:text-gray-800 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 text-center mt-6">
                        Bằng việc đặt lịch, bạn đồng ý với <span className="underline cursor-pointer">Điều khoản dịch vụ</span> và <span className="underline cursor-pointer">Chính sách bảo mật</span> của chúng tôi.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScheduleModal;
