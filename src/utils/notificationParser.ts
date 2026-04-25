import type { TFunction } from 'i18next';

export const parseNotificationMessage = (message: string, t: TFunction): string => {
    if (!message) return '';

    const patterns = [
        // Topup Success
        {
            regex: /^\s*Nạp tiền thành công: \+(\d+(?:\.\d+)*)đ\. Số dư hiện tại: (\d+(?:\.\d+)*)đ\.?\s*$/,
            key: 'notifications.patterns.topup_success',
            params: ['amount', 'balance']
        },
        {
            regex: /^\s*Nạp tiền thành công \(Sepay\): \+(\d+(?:\.\d+)*)đ\. Số dư hiện tại: (\d+(?:\.\d+)*)đ\.?\s*$/,
            key: 'notifications.patterns.topup_sepay_success',
            params: ['amount', 'balance']
        },
        {
            regex: /^\s*Bạn nhận được (\d+) điểm thưởng từ nạp tiền\.?\s*$/,
            key: 'notifications.patterns.topup_reward',
            params: ['points']
        },
        {
            regex: /^\s*Bạn nhận được (\d+) điểm thưởng nạp lần đầu!?\s*$/,
            key: 'notifications.patterns.topup_first_bonus',
            params: ['points']
        },
        {
            regex: /^\s*Bạn nhận được (\d+) điểm từ bài đăng mới\.?\s*$/,
            key: 'notifications.patterns.post_earned_points',
            params: ['points']
        },
        {
            regex: /^\s*Bạn vừa nhận được (\d+) điểm!?\s*$/,
            key: 'notifications.patterns.points_received_generic',
            params: ['points']
        },
        {
            regex: /^\s*Bạn nhận được (\d+) điểm thưởng(?:\s*\(bao gồm quà nạp đầu\))?!?\s*$/,
            key: 'notifications.patterns.bonus_points',
            params: ['amount']
        },
        // Posts
        {
            regex: /^\s*Bài đăng "(.*?)" của bạn đã được tạo thành công và đang hiển thị\.?\s*$/,
            key: 'notifications.patterns.post_created_success',
            params: ['title']
        },
        {
            regex: /^\s*Tin đăng "(.*?)" của bạn đã được duyệt và đang hiển thị công khai\.?\s*$/,
            key: 'notifications.patterns.post_approved',
            params: ['title']
        },
        {
            regex: /^\s*Tin đăng "(.*?)" của bạn đã bị từ chối\. Lý do: (.*)\s*$/,
            key: 'notifications.patterns.post_rejected',
            params: ['title', 'reason']
        },
        {
            regex: /^\s*Bạn đã đổi thành công gói (.*)\. -(\d+) điểm\.?\s*$/,
            key: 'notifications.patterns.point_redeem_success',
            params: ['name', 'cost']
        },
        // VIP
        {
            regex: /^\s*Nâng cấp gói VIP thành công: "(.*?)"\.?\s*$/,
            key: 'notifications.patterns.vip_upgrade_success',
            params: ['name']
        },
        {
            regex: /^\s*Đăng ký gói VIP "(.*?)" thành công! Thời hạn: (\d+) ngày\.?\s*$/,
            key: 'notifications.patterns.vip_purchase_success_notif',
            params: ['name', 'days']
        },
        // Appointments
        {
            regex: /^\s*(.*?) đã đặt lịch hẹn "(.*?)"\.?\s*$/,
            key: 'notifications.patterns.appointment_new',
            params: ['name', 'title']
        },
        {
            regex: /^\s*Lịch hẹn "(.*?)" của bạn đã chuyển sang trạng thái: (.*?)\.?\s*$/,
            key: 'notifications.patterns.appointment_status',
            params: ['title', 'status']
        },
        // Transactions
        {
            regex: /^\s*Yêu cầu rút tiền: ([\d,.]+) VNĐ\s*$/,
            key: 'transactions.withdraw_request',
            params: ['amount']
        },
        {
            regex: /^\s*Hoàn tiền rút: ([\d,.]+) VNĐ \(Từ chối bởi Admin\)\s*$/,
            key: 'transactions.withdraw_refund',
            params: ['amount']
        },
        {
            regex: /^\s*Topup via (.*)\s*$/,
            key: 'transactions.topup_via',
            params: ['method']
        },
        {
            regex: /^\s*Sepay: (.*) \(Ref: (.*)\)\s*$/,
            key: 'transactions.sepay_desc',
            params: ['description', 'ref']
        },
        {
            regex: /^\s*Upgrade VIP: (.*) -> (.*)\s*$/,
            key: 'transactions.vip_upgrade',
            params: ['old', 'new']
        },
        {
            regex: /^\s*Purchase VIP: (.*)\s*$/,
            key: 'transactions.vip_purchase',
            params: ['name']
        }
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern.regex);
        if (match) {
            const params: Record<string, string> = {};
            pattern.params.forEach((paramName, index) => {
                let val = match[index + 1];
                if (paramName === 'status') {
                    val = t(`common.status_list.${val}`, { defaultValue: val });
                }
                if (paramName === 'name') {
                    if (val.includes('Đẩy Tin') || val.includes('Push')) val = t('loyalty.item_push', { defaultValue: 'Post Push' });
                    else if (val.includes('VIP Bronze')) val = t('loyalty.item_vip_bronze', { defaultValue: 'VIP Bronze (1D)' });
                    else if (val.includes('VIP Silver')) val = t('loyalty.item_vip_silver', { defaultValue: 'VIP Silver (3D)' });
                    else if (val.includes('VIP Gold')) val = t('loyalty.item_vip_gold', { defaultValue: 'VIP Gold (7D)' });
                    else if (val.includes('Lead')) val = t('loyalty.item_lead', { defaultValue: 'View Lead' });
                }
                params[paramName] = val;
            });
            return t(pattern.key, params);
        }
    }

    // Legacy Admin Adjustment
    const legacyAdminEarn = message.match(/^\s*Bạn đã được cộng ([\d,.]+) điểm\. Lý do: (.*)\s*$/);
    if (legacyAdminEarn) {
        let reason = legacyAdminEarn[2];
        if (reason.includes('Thưởng cập nhật đầy đủ thông tin')) reason = t('admin.points.adjustment_reasons.profile', { defaultValue: 'Bonus for complete profile update' });
        return t('notifications.patterns.admin_legacy_earn_detail', { amount: legacyAdminEarn[1], reason });
    }

    const legacyAdminSpend = message.match(/^\s*Bạn đã bị trừ ([\d,.]+) điểm\. Lý do: (.*)\s*$/);
    if (legacyAdminSpend) {
        const reason = legacyAdminSpend[2];
        return t('notifications.patterns.admin_legacy_spend_detail', { amount: legacyAdminSpend[1], reason });
    }

    // Legacy patterns
    const dailyLogin = message.match(/^\s*Điểm danh hàng ngày: \+(\d+) điểm\.?\s*$/);
    if (dailyLogin) return t('notifications.patterns.daily_login', { points: dailyLogin[1] });

    // Bạn có 10 điểm đã hết hạn và bị trừ khỏi tài khoản.
    const pointsExpired = message.match(/^\s*Bạn có (\d+) điểm đã hết hạn và bị trừ khỏi tài khoản\.?\s*$/);
    if (pointsExpired) return t('notifications.patterns.points_expired', { points: pointsExpired[1] });

    // Bạn có 10 điểm sắp hết hạn vào ngày 01/01/2026. Hãy sử dụng ngay!
    const pointsExpiryWarn = message.match(/^\s*Bạn có (\d+) điểm sắp hết hạn vào ngày (.*)\. Hãy sử dụng ngay!?\s*$/);
    if (pointsExpiryWarn) return t('notifications.patterns.points_expiry_warn', { points: pointsExpiryWarn[1], date: pointsExpiryWarn[2] });

    // NHẮC LẠI: Bạn có 10 điểm sắp hết hạn vào ngày 01/01/2026 (còn 7 ngày).
    const pointsExpiryRemind = message.match(/^\s*NHẮC LẠI: Bạn có (\d+) điểm sắp hết hạn vào ngày (.*) \(còn 7 ngày\)\.?\s*$/);
    if (pointsExpiryRemind) return t('notifications.patterns.points_expiry_remind', { points: pointsExpiryRemind[1], date: pointsExpiryRemind[2] });

    // CẢNH BÁO KHẨN: 10 điểm của bạn sẽ hết hạn vào ngày MAI (01/01/2026).
    const pointsExpiryUrgent = message.match(/^\s*CẢNH BÁO KHẨN: (\d+) điểm của bạn sẽ hết hạn vào ngày MAI \((.*)\)\.?\s*$/);
    if (pointsExpiryUrgent) return t('notifications.patterns.points_expiry_urgent', { points: pointsExpiryUrgent[1], date: pointsExpiryUrgent[2] });

    // Bạn nhận được 10 điểm thưởng!
    const topupReward = message.match(/^\s*Bạn nhận được (\d+) điểm thưởng(!| \(bao gồm quà nạp đầu\)!)\s*$/);
    if (topupReward) {
        let base = t('notifications.patterns.topup_reward', { points: topupReward[1] });
        if (topupReward[2].includes('bao gồm quà nạp đầu')) {
            base = base.replace('!', '') + t('notifications.patterns.topup_first_bonus');
        }
        return base;
    }

    // 2. Wallet/Topup Related
    // Nạp tiền thành công: +100.000đ. Số dư hiện tại: 100.000đ.
    const topupSuccess = message.match(/^\s*Nạp tiền thành công: \+(.*)đ\. Số dư hiện tại: (.*)đ\.?\s*$/);
    if (topupSuccess) return t('notifications.patterns.topup_success', { amount: topupSuccess[1], balance: topupSuccess[2] });

    // Nạp tiền thành công (Sepay): +100.000đ. Số dư hiện tại: 100.000đ.
    const topupSuccessSepay = message.match(/^\s*Nạp tiền thành công \(Sepay\): \+(.*)đ\. Số dư hiện tại: (.*)đ\.?\s*$/);
    if (topupSuccessSepay) return t('notifications.patterns.topup_success_sepay', { amount: topupSuccessSepay[1], balance: topupSuccessSepay[2] });

    // 3. VIP Related
    // Nâng cấp gói VIP thành công: "GOLD".
    const vipUpgrade = message.match(/^\s*Nâng cấp gói VIP thành công: "(.*)"\.?\s*$/);
    if (vipUpgrade) return t('notifications.patterns.vip_upgrade_success', { name: vipUpgrade[1] });

    // Đăng ký gói VIP "BASIC" thành công! Thời hạn: 30 ngày.
    const vipPurchase = message.match(/^\s*Đăng ký gói VIP "(.*)" thành công! Thời hạn: (\d+) ngày\.?\s*$/);
    if (vipPurchase) return t('notifications.patterns.vip_purchase_success', { name: vipPurchase[1], days: vipPurchase[2] });

    // 4. Social/Interaction
    // Người dùng User A đã xem số điện thoại bài đăng "Post Title".
    const leadViewed = message.match(/^\s*(?:Người dùng )?(.*) đã xem số điện thoại(?: bài đăng)? "(.*)"\.?\s*$/);
    if (leadViewed) return t('notifications.patterns.lead_viewed', { user: leadViewed[1], post: leadViewed[2] });

    // User A đã yêu thích bài đăng "Post Title" của bạn.
    const postLiked = message.match(/^\s*(.*) đã yêu thích bài đăng "(.*)" của bạn\.?\s*$/);
    if (postLiked) return t('notifications.patterns.post_liked', { user: postLiked[1], post: postLiked[2] });

    // User A đã viết đánh giá cho bạn.
    const reviewReceived = message.match(/^\s*(.*) đã viết đánh giá cho bạn\.?\s*$/);
    if (reviewReceived) return t('notifications.patterns.review_received', { user: reviewReceived[1] });

    // 5. Post Management
    // Bài đăng "Title" của bạn đã được tạo thành công và đang hiển thị.
    const postCreated = message.match(/^\s*Bài đăng "(.*)" của bạn đã được tạo thành công và đang hiển thị\.?\s*$/);
    if (postCreated) return t('notifications.patterns.post_created', { post: postCreated[1] });

    // Tin đăng "Title" của bạn đã được duyệt và đang hiển thị công khai.
    const postApproved = message.match(/^\s*Tin đăng "(.*)" của bạn đã được duyệt và đang hiển thị công khai\.?\s*$/);
    if (postApproved) return t('notifications.patterns.post_approved', { post: postApproved[1] });

    // Tin đăng "Title" của bạn đã bị từ chối. Lý do: XXX
    const postRejected = message.match(/^\s*Tin đăng "(.*)" của bạn đã bị từ chối\. Lý do: (.*)\s*$/);
    if (postRejected) return t('notifications.patterns.post_rejected', { post: postRejected[1], reason: postRejected[2] });

    // 6. Reports
    // Chúng tôi đã nhận được báo cáo của bạn về bài đăng. Cảm ơn bạn đã đóng góp cho cộng đồng.
    if (message.trim().startsWith('Chúng tôi đã nhận được báo cáo của bạn về bài đăng')) {
        return t('notifications.patterns.report_received');
    }

    // Báo cáo mới từ người dùng về bài đăng (Lý do: XXX).
    const newReportPost = message.match(/^\s*Báo cáo mới từ người dùng về bài đăng \(Lý do: (.*)\)\.?\s*$/);
    if (newReportPost) return t('notifications.patterns.new_report_post', { reason: newReportPost[1] });

    // Báo cáo mới từ người dùng về một tài khoản (Lý do: XXX).
    const newReportUser = message.match(/^\s*Báo cáo mới từ người dùng về một tài khoản \(Lý do: (.*)\)\.?\s*$/);
    if (newReportUser) return t('notifications.patterns.new_report_user', { reason: newReportUser[1] });

    // 8. Administrative / Manual Notifications (with prefixes)
    // Matches: [CẢNH BÁO VI PHẠM]: ..., CẢNH BÁO VI PHẠM: ..., [CỘNG ĐIỂM] ..., [TRỪ ĐIỂM] ...
    const adminPrefixMatch = message.match(/^(\[?(CẢNH BÁO VI PHẠM|CỘNG ĐIỂM|TRỪ ĐIỂM|VIOLATION WARNING|POINTS ADDED|POINTS DEDUCTED|REWARD)\]?):?\s*(.*)$/i);
    if (adminPrefixMatch) {
        const prefix = adminPrefixMatch[2].toUpperCase(); // Normalize prefix
        const content = adminPrefixMatch[3].trim();

        // Recursively parse the content to handle translated sub-messages
        let localizedContent = parseNotificationMessage(content, t);

        if (prefix === 'CẢNH BÁO VI PHẠM' || prefix === 'VIOLATION WARNING') {
            return t('notifications.patterns.admin_violation_prefix', { content: localizedContent });
        }
        if (prefix === 'CỘNG ĐIỂM' || prefix === 'TRỪ ĐIỂM' || prefix === 'POINTS ADDED' || prefix === 'POINTS DEDUCTED' || prefix === 'REWARD') {
            const pointSuffixMatch = content.match(/^(.*)\s*\(([+-][\d,.]+)\s*PTS\)$/i);
            if (pointSuffixMatch) {
                const subContent = pointSuffixMatch[1].trim();
                const amount = pointSuffixMatch[2];
                let localizedSubContent = parseNotificationMessage(subContent, t);
                
                // If it's a raw translation key, translate it
                if (localizedSubContent.startsWith('admin.points.adjustment_reasons.')) {
                    localizedSubContent = t(localizedSubContent, { defaultValue: localizedSubContent });
                }

                const isEarn = ['CỘNG ĐIỂM', 'POINTS ADDED', 'REWARD'].includes(prefix);
                const key = isEarn ? 'notifications.patterns.admin_earn_detail' : 'notifications.patterns.admin_spend_detail';
                return t(key, { content: localizedSubContent, amount });
            }
            
            if (localizedContent.startsWith('admin.points.adjustment_reasons.')) {
                localizedContent = t(localizedContent, { defaultValue: localizedContent });
            }
            return t('notifications.patterns.admin_earn_prefix', { content: localizedContent });
        }
    }

    // 9. Warnings (from Admin)
    // Cảnh cáo lần 1: Nhắc nhở vi phạm. / Strike 1: Nhắc nhở vi phạm
    const warningMatch = message.match(/^\s*(?:Cảnh cáo lần|Strike|Level|Mức phạt)\s*(\d+):?\s*(.*)$/i);
    if (warningMatch) {
        const level = warningMatch[1];
        const reason = warningMatch[2].replace(/\.?\s*$/, ''); // Remove trailing dot
        let localizedReason = reason;

        if (reason.includes('Nhắc nhở vi phạm') || reason.includes('Violation reminder')) {
            localizedReason = t('notifications.patterns.target_violation_notice');
        } else if (reason.includes('15% Net Revocation') || reason.includes('Trừ 15%')) {
            localizedReason = t('admin.points.adjustment_reasons.violation_deduct_15');
        } else if (reason.includes('30% Net Revocation') || reason.includes('Trừ 30%')) {
            localizedReason = t('admin.points.adjustment_reasons.violation_deduct_30');
        } else if (reason.includes('50% Net Revocation') || reason.includes('Trừ 50%')) {
            localizedReason = t('admin.points.adjustment_reasons.violation_deduct_50');
        } else if (reason.includes('Total Asset Seizure') || reason.includes('Tịch thu toàn bộ')) {
            localizedReason = t('admin.points.adjustment_reasons.violation_ban');
        }

        return t('notifications.patterns.warning_level_detail', { level, reason: localizedReason });
    }

    // Target đã bị báo cáo vi phạm: XXX. Vui lòng kiểm tra lại.
    const violationAlert = message.match(/^\s*(.*) đã bị báo cáo vi phạm: (.*)\. Vui lòng kiểm tra lại\.?\s*$/);
    if (violationAlert) {
        let target = violationAlert[1];
        if (target === 'Bài đăng của bạn') target = t('notifications.patterns.target_your_post');
        if (target === 'Tài khoản của bạn') target = t('notifications.patterns.target_your_account');
        return t('notifications.patterns.violation_alert', { target, reason: violationAlert[2] });
    }

    // 7. Appointments
    // Yêu cầu xem nhà mới từ User A cho bài đăng: "Title"
    const appointmentNew = message.match(/^\s*Yêu cầu xem nhà mới từ (.*) cho bài đăng: "(.*)"\s*$/);
    if (appointmentNew) return t('notifications.patterns.appointment_new', { name: appointmentNew[1], title: appointmentNew[2] });

    // Lịch hẹn xem nhà cho bài đăng "Title" đã được chấp nhận.
    const appointmentAccepted = message.match(/^\s*Lịch hẹn xem nhà cho bài đăng "(.*)" đã được chấp nhận\.?\s*$/);
    if (appointmentAccepted) return t('notifications.patterns.appointment_accepted', { post: appointmentAccepted[1] });

    // Lịch hẹn xem nhà cho bài đăng "Title" bị từ chối.
    const appointmentRejected = message.match(/^\s*Lịch hẹn xem nhà cho bài đăng "(.*)" bị từ chối\.?\s*$/);
    if (appointmentRejected) return t('notifications.patterns.appointment_rejected', { post: appointmentRejected[1] });

    // 10. Post Status (from System)
    // Bài đăng "..." của bạn đã được tạo thành công và đang hiển thị.
    const postCreatedSys = message.match(/^\s*Bài đăng "(.*)" của bạn đã được tạo thành công và đang hiển thị\.?\s*$/);
    if (postCreatedSys) return t('notifications.patterns.post_created', { title: postCreatedSys[1] });

    // Tin đăng "..." của bạn đã được duyệt và đang hiển thị công khai.
    const postApprovedSys = message.match(/^\s*Tin đăng "(.*)" của bạn đã được duyệt và đang hiển thị công khai\.?\s*$/);
    if (postApprovedSys) return t('notifications.patterns.post_approved', { title: postApprovedSys[1] });

    // Tin đăng "..." của bạn đã bị từ chối. Lý do: XXX
    const postRejectedSys = message.match(/^\s*Tin đăng "(.*)" của bạn đã bị từ chối\. Lý do: (.*)\s*$/);
    if (postRejectedSys) return t('notifications.patterns.post_rejected', { title: postRejectedSys[1], reason: postRejectedSys[2] });

    // --- TOPUP NOTIFICATIONS ---
    const topupSepayPoints = message.match(/^\s*Nạp tiền thành công \(Sepay\): \+(.*)đ\. Số dư hiện tại: (.*)đ\. Bạn nhận được (\d+) điểm thưởng!\s*$/);
    if (topupSepayPoints) return t('notifications.patterns.topup_sepay_success_points', { amount: topupSepayPoints[1], balance: topupSepayPoints[2], points: topupSepayPoints[3] });

    const topupSepayBonus = message.match(/^\s*Nạp tiền thành công \(Sepay\): \+(.*)đ\. Số dư hiện tại: (.*)đ\. Bạn nhận được (\d+) điểm thưởng \(bao gồm quà nạp đầu\)?!\s*$/);
    if (topupSepayBonus) return t('notifications.patterns.topup_sepay_success_bonus', { amount: topupSepayBonus[1], balance: topupSepayBonus[2], points: topupSepayBonus[3] });

    const topupSepay = message.match(/^\s*Nạp tiền thành công \(Sepay\): \+(.*)đ\. Số dư hiện tại: (.*)đ\.\s*$/);
    if (topupSepay) return t('notifications.patterns.topup_sepay_success', { amount: topupSepay[1], balance: topupSepay[2] });

    const topupPoints = message.match(/^\s*Nạp tiền thành công: \+(.*)đ\. Số dư hiện tại: (.*)đ\. Bạn nhận được (\d+) điểm thưởng!\s*$/);
    if (topupPoints) return t('notifications.patterns.topup_success_points', { amount: topupPoints[1], balance: topupPoints[2], points: topupPoints[3] });

    const topupBonus = message.match(/^\s*Nạp tiền thành công: \+(.*)đ\. Số dư hiện tại: (.*)đ\. Bạn nhận được (\d+) điểm thưởng \(bao gồm quà nạp đầu\)?!\s*$/);
    if (topupBonus) return t('notifications.patterns.topup_success_bonus', { amount: topupBonus[1], balance: topupBonus[2], points: topupBonus[3] });

    const topupSimple = message.match(/^\s*Nạp tiền thành công: \+(.*)đ\. Số dư hiện tại: (.*)đ\.\s*$/);
    if (topupSimple) return t('notifications.patterns.topup_success', { amount: topupSimple[1], balance: topupSimple[2] });

    // Fallback
    return message;
};
