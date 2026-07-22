// filepath: frontend/src/pages/ContactScreen.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';
import { FaEnvelope, FaMapMarkerAlt, FaPhone, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import Button from '../components/ui/Button';

const ContactScreen = () => {
      const { t } = useTranslation();
      const [isSent, setIsSent] = useState(false);

      const submitHandler = (e) => {
            e.preventDefault();
            setTimeout(() => setIsSent(true), 1000);
      };

      const inputStyle = "block px-4 pb-2.5 pt-6 w-full text-sm text-dark bg-gray-50 rounded-xl border-2 border-transparent focus:outline-none focus:border-primary peer transition-all";
      const labelStyle = "absolute text-xs text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-transparent px-1 peer-focus:text-primary pointer-events-none";

      return (
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[75vh] animate-fade-in-up">
                  <Breadcrumb steps={[{ label: t('contact.title', 'Contact Us'), icon: FaEnvelope }]} />

                  <div className="text-center mb-12 mt-8">
                        <h1 className="text-4xl font-extrabold text-dark tracking-tight mb-4 uppercase">
                              {t('contact.title', 'Contact Us')}
                        </h1>
                        <p className="text-lg text-gray-500 font-medium">
                              {t('contact.subtitle', "We'd love to hear from you")}
                        </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto text-start">

                        <div className="lg:col-span-1 space-y-6">
                              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center shrink-0">
                                          <FaMapMarkerAlt className="text-xl" />
                                    </div>
                                    <div>
                                          <h3 className="font-bold text-dark mb-1">{t('contact.address', 'Address')}</h3>
                                          <p className="text-gray-500 text-sm whitespace-pre-line">{t('contact.address_val', 'London, UK\nTech Hub')}</p>
                                    </div>
                              </div>
                              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-green-50 text-green-500 rounded-full flex items-center justify-center shrink-0">
                                          <FaPhone className="text-xl" />
                                    </div>
                                    <div>
                                          <h3 className="font-bold text-dark mb-1">{t('contact.phone', 'Phone')}</h3>
                                          <p className="text-gray-500 text-sm" dir="ltr">{t('contact.phone_val', '+44 20 7946 0958')}</p>
                                    </div>
                              </div>
                              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-start gap-4">
                                    <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center shrink-0">
                                          <FaEnvelope className="text-xl" />
                                    </div>
                                    <div>
                                          <h3 className="font-bold text-dark mb-1">{t('contact.email_lbl', 'Email')}</h3>
                                          <p className="text-gray-500 text-sm" dir="ltr">{t('contact.email_val', 'support@evox.com')}</p>
                                    </div>
                              </div>
                        </div>

                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                              {isSent ? (
                                    <div className="h-full flex flex-col items-center justify-center py-12 text-center animate-fade-in-up">
                                          <FaCheckCircle className="text-6xl text-green-500 mb-4" />
                                          <h2 className="text-2xl font-bold text-dark mb-2">{t('contact.success', 'Message sent successfully!')}</h2>
                                          <button onClick={() => setIsSent(false)} className="mt-6 text-primary font-bold hover:text-dark hover:underline transition-colors focus:outline-none cursor-pointer">
                                                {t('contact.send', 'Send another message')}
                                          </button>
                                    </div>
                              ) : (
                                    <form onSubmit={submitHandler} className="space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="relative group">
                                                      <input type="text" id="name" required className={inputStyle} placeholder=" " />
                                                      <label htmlFor="name" className={labelStyle}>{t('contact.name', 'Full Name')}</label>
                                                </div>
                                                <div className="relative group">
                                                      <input type="email" id="email" required className={inputStyle} placeholder=" " dir="ltr" />
                                                      <label htmlFor="email" className={labelStyle}>{t('contact.email', 'Email Address')}</label>
                                                </div>
                                          </div>
                                          <div className="relative group">
                                                <input type="text" id="subject" required className={inputStyle} placeholder=" " />
                                                <label htmlFor="subject" className={labelStyle}>{t('contact.subject', 'Subject')}</label>
                                          </div>
                                          <div className="relative group">
                                                <textarea id="message" rows="5" required className={`${ inputStyle } resize-none`} placeholder=" "></textarea>
                                                <label htmlFor="message" className={labelStyle}>{t('contact.message', 'Your Message')}</label>
                                          </div>
                                          <Button type="submit" variant="primary" size="lg" fullWidth leftIcon={<FaPaperPlane />}>
                                                {t('contact.send', 'Send Message')}
                                          </Button>
                                    </form>
                              )}
                        </div>

                  </div>
            </div>
      );
};

export default ContactScreen;