// filepath: frontend/src/components/ProductReviews.jsx
import { useState, useContext, forwardRef } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FaStar, FaUserCircle } from 'react-icons/fa';
import Rating from './Rating';
import Button from './ui/Button';
import { useTranslation } from 'react-i18next';

const ProductReviews = forwardRef(({ productId, productRating = 0, numReviews = 0, onReviewAdded }, ref) => {
      const { userInfo } = useContext(AuthContext);
      const { t } = useTranslation();
      const { lang } = useLanguage();
      const queryClient = useQueryClient();

      const [reviewPage, setReviewPage] = useState(1);
      const [rating, setRating] = useState(0);
      const [hoverRating, setHoverRating] = useState(0);
      const [comment, setComment] = useState('');

      const [reviewLoading, setReviewLoading] = useState(false);
      const [reviewError, setReviewError] = useState('');
      const [reviewSuccess, setReviewSuccess] = useState('');

      const { data: reviewsData } = useQuery({
            queryKey: ['productReviews', productId, reviewPage],
            queryFn: async () => {
                  const { data } = await axios.get(`/api/products/${ productId }/reviews?pageNumber=${ reviewPage }`);
                  return data;
            },
            enabled: !!productId,
            keepPreviousData: true
      });

      const reviews = reviewsData?.reviews || [];
      const reviewPages = reviewsData?.pages || 1;

      const submitReviewHandler = async (e) => {
            e.preventDefault();
            setReviewLoading(true);
            setReviewError('');

            if (rating === 0) {
                  setReviewError(
                        t('product.reviews.select_rating', lang === 'ar' ? 'الرجاء اختيار التقييم بالنجوم' : 'Please select a star rating')
                  );
                  setReviewLoading(false);
                  return;
            }

            try {
                  const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
                  await axios.post(`/api/products/${ productId }/reviews`, { rating, comment }, config);

                  setReviewSuccess(
                        t('product.reviews.submit_success', lang === 'ar' ? 'تم تقديم التقييم بنجاح!' : 'Review submitted successfully!')
                  );
                  setRating(0);
                  setComment('');

                  queryClient.invalidateQueries({ queryKey: ['productReviews', productId] });
                  queryClient.invalidateQueries({ queryKey: ['product', productId] });

                  if (onReviewAdded) onReviewAdded();

                  setReviewLoading(false);
                  setTimeout(() => setReviewSuccess(''), 4000);
            } catch (error) {
                  setReviewError(
                        error.response?.data?.message ||
                        t('product.reviews.submit_failed', lang === 'ar' ? 'فشل في إرسال التقييم' : 'Failed to submit review')
                  );
                  setReviewLoading(false);
            }
      };

      return (
            <div ref={ref} className="mt-16 pt-16 border-t border-gray-100 scroll-mt-24 animate-fade-in-up">

                  {/* 🌟 1. العنوان الرئيسي لقسم المراجعات */}
                  <div className="flex justify-between items-center mb-10">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-dark tracking-tight text-start">
                              {lang === 'ar' ? (
                                    <>آراء <span className="text-primary">العملاء</span></>
                              ) : (
                                    <>Customer <span className="text-primary">Reviews</span></>
                              )}
                        </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

                        {/* 🌟 2. قائمة التقييمات المكتوبة */}
                        <div className="lg:col-span-7 space-y-6">
                              {reviews.length === 0 ? (
                                    <div className="bg-gray-50 rounded-3xl p-10 text-center border border-gray-100">
                                          <p className="text-gray-500 font-bold text-lg mb-2">
                                                {t('product.reviews.no_reviews', lang === 'ar' ? 'لا توجد تقييمات بعد.' : 'No reviews yet.')}
                                          </p>
                                          <p className="text-sm text-gray-400">
                                                {t('product.reviews.be_first', lang === 'ar' ? 'كن أول من يشارك رأيه حول هذا المنتج!' : 'Be the first to share your thoughts about this product!')}
                                          </p>
                                    </div>
                              ) : (
                                    <>
                                          {reviews.map((review) => (
                                                <div key={review._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:border-gray-200 transition-colors text-start">
                                                      <div className="flex items-center gap-4 mb-4">
                                                            <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center text-3xl border border-blue-100 shrink-0 overflow-hidden">
                                                                  <FaUserCircle className="mt-1 opacity-80" />
                                                            </div>
                                                            <div>
                                                                  <h4 className="font-bold text-dark">{review.name}</h4>
                                                                  <div className="flex items-center gap-2 mt-1">
                                                                        <Rating value={review.rating} />
                                                                        <span className="text-xs font-bold text-gray-400">{review.createdAt.substring(0, 10)}</span>
                                                                  </div>
                                                            </div>
                                                      </div>
                                                      <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-50">{review.comment}</p>
                                                </div>
                                          ))}

                                          {reviewPages > 1 && (
                                                <div className="flex gap-2 mt-8" dir="ltr">
                                                      {[...Array(reviewPages).keys()].map((x) => (
                                                            <Button
                                                                  key={x + 1}
                                                                  onClick={() => setReviewPage(x + 1)}
                                                                  variant={x + 1 === reviewPage ? "secondary" : "outline"}
                                                                  size="sm"
                                                                  className={`w-10 h-10 !p-0 ${ x + 1 === reviewPage ? 'scale-110' : '' }`}
                                                            >
                                                                  {x + 1}
                                                            </Button>
                                                      ))}
                                                </div>
                                          )}
                                    </>
                              )}
                        </div>

                        {/* 🌟 3. قسم أضف تقييماً: مربع النجوم يقع خارج الحاوية البيضاء وفوقها مباشرةً */}
                        <div className="lg:col-span-5 text-start">

                              {/* 🌟 مربع متوسط التقييمات وعدد المقيمين (خارج الحاوية البيضاء) */}
                              {numReviews > 0 && (
                                    <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100 shadow-sm mb-6 transition-all hover:shadow-md w-fit">
                                          <div className="text-4xl font-black text-dark" dir="ltr">{Number(productRating).toFixed(1)}</div>
                                          <div className="flex flex-col text-start">
                                                <Rating value={productRating} />
                                                <span className="text-sm font-bold text-gray-500 mt-1">
                                                      {t('product.reviews.based_on', {
                                                            count: numReviews,
                                                            defaultValue: lang === 'ar' ? `بناءً على ${ numReviews } تقييم` : `Based on ${ numReviews } reviews`
                                                      })}
                                                </span>
                                          </div>
                                    </div>
                              )}

                              {/* 🌟 الحاوية البيضاء التي تضم نموذج "WRITE A REVIEW / أضف تقييماً" */}
                              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/40 sticky top-24">

                                    <h3 className="text-xl font-extrabold text-dark mb-6 uppercase tracking-wide">
                                          {t('product.reviews.add_review', lang === 'ar' ? 'أضف تقييماً' : 'Write a Review')}
                                    </h3>

                                    {reviewError && <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold animate-fade-in-up">{reviewError}</div>}
                                    {reviewSuccess && <div className="mb-6 p-4 bg-green-50 text-green-600 border border-green-100 rounded-xl text-sm font-bold animate-fade-in-up">{reviewSuccess}</div>}

                                    {userInfo ? (
                                          <form onSubmit={submitReviewHandler} className="space-y-6">
                                                <div>
                                                      <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">
                                                            {t('product.reviews.overall_rating', lang === 'ar' ? 'التقييم العام' : 'Overall Rating')}
                                                      </label>
                                                      <div className="flex gap-1 items-center bg-gray-50 w-fit p-2 rounded-xl border border-gray-100" dir="ltr">
                                                            {[1, 2, 3, 4, 5].map((star) => (
                                                                  <button
                                                                        type="button"
                                                                        key={star}
                                                                        className="text-3xl focus:outline-none transition-transform hover:scale-110 p-1 cursor-pointer"
                                                                        onClick={() => setRating(star)}
                                                                        onMouseEnter={() => setHoverRating(star)}
                                                                        onMouseLeave={() => setHoverRating(0)}
                                                                  >
                                                                        <FaStar className={`transition-colors duration-200 ${ star <= (hoverRating || rating) ? 'text-amber-400 drop-shadow-sm' : 'text-gray-300' }`} />
                                                                  </button>
                                                            ))}
                                                      </div>
                                                </div>

                                                <div>
                                                      <label className="block text-sm font-bold text-gray-600 mb-3 uppercase tracking-wider">
                                                            {t('product.reviews.your_comment', lang === 'ar' ? 'تعليقك' : 'Your Comment')}
                                                      </label>
                                                      <textarea
                                                            rows="4"
                                                            value={comment}
                                                            required
                                                            onChange={(e) => setComment(e.target.value)}
                                                            placeholder={t('product.reviews.comment_placeholder', lang === 'ar' ? 'شاركنا تجربتك ورأيك بالمنتج...' : 'Share your experience with this product...')}
                                                            className="w-full bg-gray-50 text-dark text-sm p-4 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white resize-none transition-all"
                                                      ></textarea>
                                                </div>

                                                <Button
                                                      type="submit"
                                                      disabled={rating === 0}
                                                      isLoading={reviewLoading}
                                                      variant="secondary"
                                                      size="lg"
                                                      fullWidth
                                                >
                                                      {t('product.reviews.submit_button', lang === 'ar' ? 'إرسال التقييم' : 'Submit Review')}
                                                </Button>
                                          </form>
                                    ) : (
                                          <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 text-center">
                                                <FaUserCircle className="text-5xl text-gray-300 mx-auto mb-4" />
                                                <p className="text-dark font-bold mb-6">
                                                      {t('product.reviews.login_to_review', lang === 'ar' ? 'يرجى تسجيل الدخول لمشاركة رأيك.' : 'Please log in to share your thoughts.')}
                                                </p>
                                                <Button to="/login" variant="secondary" size="md">
                                                      {t('header.sign_in', lang === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
                                                </Button>
                                          </div>
                                    )}
                              </div>
                        </div>
                  </div>
            </div>
      );
});

ProductReviews.displayName = 'ProductReviews';
export default ProductReviews;