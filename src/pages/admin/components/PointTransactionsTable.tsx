import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { pointsAPI } from '../../../services/api';

const PointTransactionsTable = () => {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [filterType, setFilterType] = useState('ALL'); // ALL, EARN, SPEND

    // Fetch logs
    const { data: logsData, isLoading } = useQuery({
        queryKey: ['admin', 'point-logs', page, filterType],
        queryFn: () => pointsAPI.getAllLogs({
            page,
            limit: 20,
            type: filterType === 'ALL' ? undefined : filterType
        }),
        select: (res) => res.data
    });

    return (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-gray-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-900">{t('admin.points.tab_history')}</h2>

                <div className="flex items-center gap-3">
                    <select
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        value={filterType}
                        onChange={(e) => {
                            setFilterType(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="ALL">{t('admin.common.all')}</option>
                        <option value="EARN">{t('admin.points.type_earn')}</option>
                        <option value="SPEND">{t('admin.points.type_spend')}</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="px-6 py-4 font-medium">{t('admin.users.title')}</th>
                            <th className="px-6 py-4 font-medium">{t('admin.common.action')}</th>
                            <th className="px-6 py-4 font-medium">{t('admin.common.points')}</th>
                            <th className="px-6 py-4 font-medium">{t('admin.common.description')}</th>
                            <th className="px-6 py-4 font-medium">{t('admin.common.created_at')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{t('admin.common.loading')}</td>
                            </tr>
                        ) : logsData?.data?.length > 0 ? (
                            logsData.data.map((log: any) => (
                                <tr key={log._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {log.userId?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{log.userId?.name || t('admin.common.deleted_user')}</p>
                                                <p className="text-xs text-gray-500">{log.userId?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${log.type === 'EARN'
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-red-50 text-red-700'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 font-bold ${log.type === 'EARN' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {log.type === 'EARN' ? '+' : '-'}{log.points}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {(() => {
                                            const rawDesc = log.description || '-';
                                            const desc = rawDesc.trim();

                                            // 1. Earned from activity
                                            if (desc.startsWith('Tích lũy từ hoạt động: ')) {
                                                const action = desc.replace('Tích lũy từ hoạt động: ', '');
                                                return t('admin.points.earned_from', {
                                                    action: t(`admin.points.actions.${action}`, { defaultValue: action })
                                                });
                                            }

                                            // 2. Added credits to VIP
                                            const pushMatch = desc.match(/Thêm (\d+) lượt đẩy tin vào VIP/);
                                            if (pushMatch) {
                                                return t('admin.points.added_push_to_vip', { count: pushMatch[1] });
                                            }
                                            const leadMatch = desc.match(/Thêm (\d+) lượt xem (lead|SĐT) vào VIP/);
                                            if (leadMatch) {
                                                return t('admin.points.added_lead_to_vip', { count: leadMatch[1] });
                                            }

                                            // 3. Penalty Warnings
                                            const basicWarningMatch = desc.match(/^Cảnh cáo lần (\d+)\.?$/);
                                            if (basicWarningMatch) return t('admin.points.warning_level', { level: basicWarningMatch[1] });

                                            const detailedWarningMatch = desc.match(/^Cảnh cáo lần (\d+): Nhắc nhở vi phạm\.?$/);
                                            if (detailedWarningMatch) {
                                                return t('admin.points.warning_level', { level: detailedWarningMatch[1] }) + ": " + t('admin.points.adjustment_reasons.violation_warning');
                                            }

                                            // 3. Redeem/Activate Reward
                                            const labelMapping: Record<string, string> = {
                                                "Đẩy Tin (1 lần)": "ITEM_POST_PUSH",
                                                "VIP Bronze (1 Ngày)": "ITEM_VIP_BRONZE_1DAY",
                                                "VIP Silver (3 Ngày)": "ITEM_VIP_SILVER_3DAY",
                                                "VIP Gold (7 Ngày)": "ITEM_VIP_GOLD_7DAY",
                                                "Xem 1 Lead (SĐT)": "LEAD_CREDIT",
                                                "VIP Bronze": "ITEM_VIP_BRONZE_1DAY",
                                                "VIP Silver": "ITEM_VIP_SILVER_3DAY",
                                                "VIP Gold": "ITEM_VIP_GOLD_7DAY"
                                            };

                                            const reversePhraseMapping: Record<string, string> = {
                                                "Điểm danh hàng ngày": "admin.points.actions.DAILY_LOGIN",
                                                "Nạp tiền nhận điểm": "admin.points.adjustment_reasons.topup_bonus",
                                                "Nhắc nhở vi phạm": "admin.points.adjustment_reasons.violation_warning",
                                                "Nhắc nhở vi phạm.": "admin.points.adjustment_reasons.violation_warning",
                                                "Thưởng cập nhật hồ sơ cá nhân đầy đủ + ảnh đại diện": "admin.points.adjustment_reasons.profile",
                                                "Đền bù do gặp sự cố kỹ thuật hệ thống.": "admin.points.adjustment_reasons.compensation",
                                                "Khen thưởng thành viên hoạt động tích cực.": "admin.points.adjustment_reasons.active_user",
                                                "Thưởng nâng cấp VIP": "admin.points.adjustment_reasons.vips_bonus"
                                            };

                                            if (reversePhraseMapping[desc]) {
                                                return t(reversePhraseMapping[desc]);
                                            }

                                            if (reversePhraseMapping[desc + '.']) {
                                                return t(reversePhraseMapping[desc + '.']);
                                            }

                                            // 4. Regex for Expired Points
                                            // Format: "Điểm hết hạn: -10 điểm (từ lô tích ngày 01/01/2024)"
                                            const expiryMatch = desc.match(/^Điểm hết hạn: -(\d+) điểm \(từ lô tích ngày (.*)\)\.?$/);
                                            if (expiryMatch) {
                                                return t('admin.points.expired_log', {
                                                    points: expiryMatch[1],
                                                    date: expiryMatch[2]
                                                });
                                            }

                                            // 5. Regex for Admin Adjustments (Legacy)
                                            const adminAddMatch = desc.match(/^Admin cộng điểm: \+(\d+)\.?$/);
                                            if (adminAddMatch) return t('admin.points.adjustment_admin_add', { amount: adminAddMatch[1] });

                                            const adminSubMatch = desc.match(/^Admin trừ điểm: -(\d+)\.?$/);
                                            if (adminSubMatch) return t('admin.points.adjustment_admin_sub', { amount: adminSubMatch[1] });

                                            if (desc.startsWith('Đổi quà: ')) {
                                                const label = desc.replace('Đổi quà: ', '');
                                                const mappedKey = labelMapping[label];
                                                return t('admin.points.redeemed_for', {
                                                    label: mappedKey ? t(`admin.points.actions.${mappedKey}`) : label
                                                });
                                            }

                                            if (desc.startsWith('Kích hoạt: ') || desc.startsWith('Kích hoạt ')) {
                                                const label = desc.replace(/Kích hoạt:?\s+/, '');
                                                const mappedKey = labelMapping[label];
                                                return t('admin.points.activated', {
                                                    label: mappedKey ? t(`admin.points.actions.${mappedKey}`) : label
                                                });
                                            }

                                            return rawDesc;
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                    {t('admin.common.no_data')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination UI */}
            {logsData?.pagination && logsData.pagination.total > 1 && (
                <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-center items-center gap-4">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 transition-all font-medium"
                    >
                        {t('admin.common.prev', { defaultValue: 'Trang trước' })}
                    </button>
                    <span className="text-sm font-medium text-gray-600 px-4">
                        {t('admin.common.page_display', { defaultValue: 'Hiển thị trang' })} {page} / {logsData.pagination.total}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(logsData.pagination.total, p + 1))}
                        disabled={page === logsData.pagination.total}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-white hover:border-gray-300 disabled:opacity-50 transition-all font-medium"
                    >
                        {t('admin.common.next', { defaultValue: 'Trang sau' })}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PointTransactionsTable;
