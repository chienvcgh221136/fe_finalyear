import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../utils/pathUtils';

const SEO = () => {
    const { i18n } = useTranslation();
    const location = useLocation();

    useEffect(() => {
        // Update HTML lang attribute
        const currentLng = i18n.language.split('-')[0];
        document.documentElement.lang = currentLng;

        // Remove existing hreflang tags
        const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
        existingHreflangs.forEach(el => el.remove());

        // Add hreflang tags
        const baseUrl = window.location.origin;
        const pathWithoutLng = location.pathname.replace(/^\/(vi|en)/, '');

        SUPPORTED_LANGUAGES.forEach(lng => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.href = `${baseUrl}/${lng}${pathWithoutLng}`;
            link.hreflang = lng;
            document.head.appendChild(link);
        });

        // Add x-default
        const xDefault = document.createElement('link');
        xDefault.rel = 'alternate';
        xDefault.href = `${baseUrl}/${DEFAULT_LANGUAGE}${pathWithoutLng}`;
        xDefault.hreflang = 'x-default';
        document.head.appendChild(xDefault);

    }, [i18n.language, location.pathname]);

    return null;
};

export default SEO;
