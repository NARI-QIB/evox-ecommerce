import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';
import { FaInfoCircle, FaBullseye, FaEye, FaHeart } from 'react-icons/fa';

const AboutScreen = () => {
      const { t } = useTranslation();

      return (
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[75vh] animate-fade-in-up">
                  <Breadcrumb steps={[{ label: t('about.title', 'About Us'), icon: FaInfoCircle }]} />

                  <div className="text-center mb-16 mt-8">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-dark tracking-tight mb-4 uppercase">
                              {t('about.title', 'About EVOX')}
                        </h1>
                        <p className="text-lg text-gray-500 font-medium max-w-2xl mx-auto">
                              {t('about.subtitle', 'Empowering Athletes Worldwide')}
                        </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                              <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaBullseye className="text-2xl" />
                              </div>
                              <h2 className="text-2xl font-bold text-dark mb-4">{t('about.mission_title', 'Our Mission')}</h2>
                              <p className="text-gray-600 leading-relaxed">
                                    {t('about.mission_desc', 'To equip every athlete with the highest quality gear, pushing the boundaries of human performance and athletic achievement.')}
                              </p>
                        </div>

                        <div className="bg-dark p-8 rounded-3xl shadow-xl text-center transform md:-translate-y-4">
                              <div className="w-16 h-16 bg-white/10 text-accent rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaEye className="text-2xl" />
                              </div>
                              <h2 className="text-2xl font-bold text-white mb-4">{t('about.vision_title', 'Our Vision')}</h2>
                              <p className="text-gray-300 leading-relaxed">
                                    {t('about.vision_desc', 'To be the ultimate global destination for sports enthusiasts, fostering a community built on resilience, dedication, and excellence.')}
                              </p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaHeart className="text-2xl" />
                              </div>
                              <h2 className="text-2xl font-bold text-dark mb-4">{t('about.values_title', 'Core Values')}</h2>
                              <p className="text-gray-600 leading-relaxed">
                                    {t('about.values_desc', 'Integrity, Innovation, and Inspiration. We believe in providing products that not only look good but perform flawlessly under pressure.')}
                              </p>
                        </div>

                  </div>
            </div>
      );
};

export default AboutScreen;