import { useParams } from 'react-router-dom';

export const SUPPORTED_LANGUAGES = ['vi', 'en'];
export const DEFAULT_LANGUAGE = 'vi';

export const getLocalizedPath = (path: string, lng: string) => {
    if (!path.startsWith('/')) path = `/${path}`;

    // Remove existing language prefix if any
    const cleanPath = path.replace(/^\/(vi|en)/, '');

    return `/${lng}${cleanPath === '' ? '' : cleanPath}`;
};

export const useLocalizedPath = () => {
    const { lng } = useParams();
    const currentLng = lng || DEFAULT_LANGUAGE;

    return (path: string) => getLocalizedPath(path, currentLng);
};
