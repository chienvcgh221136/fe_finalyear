import { Link, type LinkProps } from 'react-router-dom';
import { useLocalizedPath } from '../../utils/pathUtils';

interface LocalizedLinkProps extends LinkProps {
    to: string;
}

const LocalizedLink = ({ to, children, ...props }: LocalizedLinkProps) => {
    const l = useLocalizedPath();

    return (
        <Link to={l(to)} {...props}>
            {children}
        </Link>
    );
};

export default LocalizedLink;
