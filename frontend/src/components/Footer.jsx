// filepath: frontend/src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFacebookF, FaInstagram, FaEnvelope, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-dark text-gray-400 mt-20 relative border-t-4 border-accent z-40">
      <div className="container mx-auto px-4 pt-16 pb-8 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

          {/* Brand Section */}
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" className="text-4xl md:text-5xl font-heading font-bold text-white italic tracking-tighter block mb-6 hover:scale-105 transition-transform w-fit">
              EVO<span className="text-primary">X</span>
            </Link>
            <p className="text-sm leading-relaxed mb-6">
              {t('footer.desc', 'Your ultimate destination for premium sports gear. Push your limits and redefine your boundaries with top-tier equipment.')}
            </p>
            <div className="flex space-x-4 rtl:space-x-reverse">
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-dark hover:-translate-y-1 transition-all duration-300">
                <FaFacebookF />
              </a>
              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-accent hover:text-dark hover:-translate-y-1 transition-all duration-300">
                <FaInstagram />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-heading text-xl mb-6 tracking-wide uppercase">
              {t('footer.quick_links', 'Quick Links')}
            </h4>
            <ul className="space-y-3 font-medium text-sm">
              <li>
                <Link to="/search" className="hover:text-accent transition-colors flex items-center gap-2 w-fit">
                  <span className="text-primary text-xs">⚡</span> {t('footer.store', 'Store')}
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-accent transition-colors flex items-center gap-2 w-fit">
                  <span className="text-primary text-xs">⚡</span> {t('footer.shopping_cart', 'Shopping Cart')}
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-accent transition-colors flex items-center gap-2 w-fit">
                  <span className="text-primary text-xs">⚡</span> {t('footer.my_account', 'My Account')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <h4 className="text-white font-heading text-xl mb-6 tracking-wide uppercase">
              {t('footer.company', 'Company')}
            </h4>
            <ul className="space-y-3 font-medium text-sm">
              <li>
                <Link to="/about" className="hover:text-accent transition-colors flex items-center gap-2 w-fit">
                  {t('footer.about', 'About Us')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-accent transition-colors flex items-center gap-2 w-fit">
                  {t('footer.contact', 'Contact Us')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-accent transition-colors flex items-center gap-2 w-fit">
                  {t('footer.faq', 'FAQ')}
                </Link>
              </li>
              <li className="pt-2">
                <Link to="/privacy" className="hover:text-gray-200 transition-colors flex items-center gap-2 w-fit text-xs text-gray-500">
                  {t('footer.privacy', 'Privacy Policy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-gray-200 transition-colors flex items-center gap-2 w-fit text-xs text-gray-500">
                  {t('footer.terms', 'Terms of Service')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-heading text-xl mb-6 tracking-wide uppercase">
              {t('footer.support', 'Support')}
            </h4>
            <ul className="space-y-4 font-medium text-sm">
              <li className="flex items-start gap-3">
                <FaMapMarkerAlt className="text-accent mt-1 shrink-0" />
                <span className="whitespace-pre-line">
                  {t('footer.address', 'Syria , Lattakia , Lattakia university')}
                </span>
              </li>
              <li className="flex items-center gap-3">
                <FaPhone className="text-accent shrink-0" />
                <span dir="ltr">+963 994 525 024</span>
              </li>
              <li className="flex items-center gap-3">
                <FaEnvelope className="text-accent shrink-0" />
                <a href="mailto:nariqiblawi.7@gmail.com" className="hover:text-white transition-colors" dir="ltr">
                  nariqiblawi.7@gmail.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-sm font-medium">
            &copy; {new Date().getFullYear()} <span className="text-white font-heading text-lg italic">EVO<span className="text-primary">X</span></span>. {t('footer.all_rights', 'All rights reserved.')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;