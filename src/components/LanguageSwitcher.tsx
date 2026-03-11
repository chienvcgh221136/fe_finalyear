import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { getLocalizedPath } from '../utils/pathUtils';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { lng } = useParams();

    const changeLanguage = (newLng: string) => {
        if (newLng === lng) return;

        i18n.changeLanguage(newLng);
        localStorage.setItem('i18nextLng', newLng);

        const newPath = getLocalizedPath(location.pathname, newLng);
        navigate(`${newPath}${location.search}`, { replace: true });
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
            <Globe size={14} className="text-gray-400" />
            <div className="flex items-center text-[11px] font-bold tracking-wider">
                <button
                    onClick={() => changeLanguage('vi')}
                    className={`px-1.5 py-0.5 rounded transition-colors ${i18n.language.startsWith('vi')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    VI
                </button>
                <span className="text-gray-200 mx-0.5">|</span>
                <button
                    onClick={() => changeLanguage('en')}
                    className={`px-1.5 py-0.5 rounded transition-colors ${i18n.language.startsWith('en')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    EN
                </button>
            </div>
        </div>
    );
};

export default LanguageSwitcher;
