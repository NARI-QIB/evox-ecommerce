import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumb';
import { FaQuestionCircle, FaChevronDown } from 'react-icons/fa';

const FAQScreen = () => {
      const { t } = useTranslation();

      const faqs = [
            { q: t('faq.q1', 'What payment methods do you accept?'), a: t('faq.a1', 'We currently accept Cash on Delivery (COD). Credit card and PayPal payments are coming very soon.') },
            { q: t('faq.q2', 'How long does shipping take?'), a: t('faq.a2', 'Standard shipping usually takes 3-5 business days depending on your location. You can track your order using the tracking token provided at checkout.') },
            { q: t('faq.q3', 'Can I return or exchange an item?'), a: t('faq.a3', 'Yes, we offer a 14-day return and exchange policy for unused items in their original packaging.') },
            { q: t('faq.q4', 'How do I track my guest order?'), a: t('faq.a4', "You can use the 'Track Guest Order' option at checkout or login page by entering the secure 64-character token provided when you placed the order.") }
      ];

      return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[75vh] animate-fade-in-up">
                  <Breadcrumb steps={[{ label: t('faq.title', 'FAQ'), icon: FaQuestionCircle }]} />

                  <div className="text-center mb-12 mt-8">
                        <h1 className="text-4xl font-extrabold text-dark tracking-tight mb-4 uppercase">
                              {t('faq.title', 'Frequently Asked Questions')}
                        </h1>
                        <p className="text-lg text-gray-500 font-medium">
                              {t('faq.subtitle', 'Everything you need to know about EVOX')}
                        </p>
                  </div>

                  <div className="space-y-4">
                        {faqs.map((faq, index) => (
                              <details key={index} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden open:border-primary transition-colors">
                                    <summary className="flex items-center justify-between font-bold text-lg text-dark p-6 cursor-pointer select-none">
                                          {faq.q}
                                          <FaChevronDown className="text-primary transition-transform duration-300 group-open:rotate-180" />
                                    </summary>
                                    <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                                          {faq.a}
                                    </div>
                              </details>
                        ))}
                  </div>
            </div>
      );
};

export default FAQScreen;