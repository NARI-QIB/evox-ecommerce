// filepath: frontend/src/components/ui/Button.jsx
import { FaSpinner } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Button = ({
      children,
      variant = 'primary', // primary, secondary, soft, outline, danger, ghost
      size = 'md',         // sm, md, lg
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      className = '',
      to,
      disabled,
      type = 'button',
      ...props
}) => {
      // 🌟 الخصائص الأساسية: سلاسة الحركة وتأثير النقر النابض (active:scale)
      const baseClasses = "inline-flex items-center justify-center gap-2 font-heading uppercase tracking-wider font-black transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 active:scale-[0.97] active:translate-y-0 select-none text-center cursor-pointer";

      // 🌟 التعديل الجوهري للـ Hover: المحافظة على اللون الأساسي مع رفع الزر (Elevation) وزيادة الظل والوهج
      const variants = {
            // الزر الرئيسي: برتقالي يصبح داكناً قليلاً مع توهج برتقالي
            primary: "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-[#e06612] hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 border border-transparent disabled:bg-primary/50 disabled:shadow-none",

            // الزر الثانوي: كحلي/أسود يصبح أفتح قليلاً مع زيادة الظل الداكن
            secondary: "bg-dark text-white shadow-lg shadow-dark/20 hover:bg-slate-800 hover:shadow-xl hover:shadow-dark/40 hover:-translate-y-0.5 border border-transparent disabled:bg-dark/50 disabled:shadow-none",

            // الزر الناعم: رمادي فاتح يبقى رمادياً لكن أغمق بدرجة بسيطة مع ظل خفيف
            soft: "bg-slate-100 text-dark hover:bg-slate-200 hover:shadow-sm hover:-translate-y-0.5 border border-transparent disabled:bg-slate-50 disabled:text-gray-400 disabled:shadow-none",

            // زر الإطار المفرغ: تلوين الحدود والنص بالبرتقالي عند الـ Hover مع خلفية شفافة جداً
            outline: "bg-white text-gray-500 border-2 border-gray-200 hover:border-primary hover:text-primary hover:bg-primary/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:border-gray-100 disabled:text-gray-300 disabled:shadow-none",

            // زر الخطر/الحذف: أحمر يتحول لأحمر داكن مع توهج
            danger: "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/40 hover:-translate-y-0.5 border border-transparent disabled:bg-red-400 disabled:shadow-none",

            // الزر الشفاف تماماً: يستخدم للنصوص القابلة للنقر كأزرار
            ghost: "bg-transparent text-gray-500 hover:text-dark hover:bg-gray-100 border border-transparent disabled:opacity-50"
      };

      const sizes = {
            sm: "px-4 py-2 text-xs rounded-lg tracking-widest",
            md: "px-6 py-3.5 text-sm rounded-xl tracking-wider",
            lg: "px-8 py-4.5 text-base md:text-lg rounded-2xl tracking-widest"
      };

      const isDisabled = disabled || isLoading;

      const finalClasses = `
    ${ baseClasses } 
    ${ variants[variant] } 
    ${ sizes[size] } 
    ${ fullWidth ? 'flex w-full' : 'inline-flex' } 
    ${ isDisabled ? 'opacity-70 cursor-not-allowed hover:transform-none hover:shadow-none' : '' } 
    ${ className }
  `.trim();

      const content = (
            <>
                  {isLoading && <FaSpinner className="animate-spin text-current" />}
                  {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
                  <span className="truncate">{children}</span>
                  {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
            </>
      );

      // التعامل مع الروابط (React Router)
      if (to && !isDisabled) {
            return (
                  <Link to={to} className={finalClasses} {...props}>
                        {content}
                  </Link>
            );
      }

      // التعامل مع الأزرار العادية
      return (
            <button
                  type={type}
                  className={finalClasses}
                  disabled={isDisabled}
                  {...props}
            >
                  {content}
            </button>
      );
};

export default Button;