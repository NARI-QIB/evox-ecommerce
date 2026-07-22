// filepath: frontend/src/components/Breadcrumb.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // 🌟
import { FaChevronRight, FaHome } from 'react-icons/fa';

const Breadcrumb = ({ steps }) => {
  const { t } = useTranslation(); // 🌟

  return (
    <nav className="flex items-center flex-wrap gap-2 text-sm font-semibold text-gray-500 mb-6 sm:mb-8 tracking-wide animate-fade-in-up">
      <Link to="/" className="flex items-center gap-1.5 hover:text-primary transition-colors duration-300">
        <FaHome className="text-lg mb-0.5" />
        <span>{t('breadcrumb.store')}</span>
      </Link>

      {steps && steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const Icon = step.icon;

        return (
          <div key={index} className="flex items-center gap-2">
            <FaChevronRight className="text-[10px] text-gray-400 rtl:rotate-180" />

            {isLast || !step.url ? (
              <span className="text-primary font-bold flex items-center gap-1.5 cursor-default">
                {Icon && <Icon className="text-sm mb-0.5" />}
                <span className="truncate max-w-[200px] md:max-w-md">{step.label}</span>
              </span>
            ) : (
              <Link to={step.url} className="flex items-center gap-1.5 hover:text-primary transition-colors duration-300">
                {Icon && <Icon className="text-sm mb-0.5" />}
                <span className="truncate max-w-[200px] md:max-w-md">{step.label}</span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;