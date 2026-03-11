import React from 'react';
import { useTranslation } from 'react-i18next';

interface PasswordStrengthProps {
    password: string;
    onScoreChange?: (score: number) => void;
}

export const calculatePasswordStrength = (password: string): number => {
    if (!password) return 0;
    let score = 0;

    // Length >= 8 (25%)
    if (password.length >= 8) score += 25;

    // Contains Uppercase (15%)
    if (/[A-Z]/.test(password)) score += 15;

    // Contains Lowercase (15%)
    if (/[a-z]/.test(password)) score += 15;

    // Contains Number (20%)
    if (/[0-9]/.test(password)) score += 20;

    // Contains Special Character (25%)
    if (/[^A-Za-z0-9]/.test(password)) score += 25;

    return score;
};

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, onScoreChange }) => {
    const { t } = useTranslation();
    const score = calculatePasswordStrength(password);

    React.useEffect(() => {
        if (onScoreChange) {
            onScoreChange(score);
        }
    }, [score, onScoreChange]);

    const getStrengthLabel = (s: number) => {
        if (s === 0) return { label: t('auth.password_strength.empty'), color: 'bg-gray-500' };
        if (s < 40) return { label: t('auth.password_strength.very_weak'), color: 'bg-red-500' };
        if (s < 70) return { label: t('auth.password_strength.weak'), color: 'bg-orange-500' };
        if (s < 90) return { label: t('auth.password_strength.good'), color: 'bg-blue-500' };
        return { label: t('auth.password_strength.very_safe'), color: 'bg-green-500' };
    };

    const strength = getStrengthLabel(score);

    return (
        <div className="mt-2 space-y-2">
            <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-medium">{t('auth.password_strength.safety_level')} {score}%</span>
                <span className={`font-bold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
            </div>

            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-500 ${strength.color}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>

            {/* Hint for improvement if score < 70 */}
            {password.length > 0 && score < 70 && (
                <p className="text-[10px] text-gray-500 leading-tight">
                    {t('auth.password_strength.hint')}
                </p>
            )}
        </div>
    );
};

export default PasswordStrength;

