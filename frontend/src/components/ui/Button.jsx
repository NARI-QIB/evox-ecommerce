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
      // 🌟 تم إضافة active:translate-y-0 لضمان سلاسة حركة النقر مع الـ hover
      const baseClasses = "inline-flex items-center justify-center gap-2 font-heading uppercase tracking-wider font-black transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 active:scale-[0.97] active:translate-y-0 select-none text-center cursor-pointer";

      const variants = {
            primary: "bg-primary text-white shadow-lg shadow-primary/10 hover:bg-dark hover:text-white hover:shadow-xl hover:shadow-dark/20 hover:-translate-y-0.5 border border-transparent disabled:bg-primary/70",
            secondary: "bg-dark text-white shadow-lg shadow-dark/10 hover:bg-primary hover:text-white hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-0.5 border border-transparent disabled:bg-dark/70",
            soft: "bg-slate-100 text-dark hover:bg-dark hover:text-white border border-transparent disabled:bg-slate-50 disabled:text-gray-400",
            // 🌟 تم تعديل hover:border-dark و hover:text-dark إلى hover:border-primary و hover:text-primary
            outline: "bg-transparent text-gray-500 border border-gray-200 hover:border-primary hover:text-primary shadow-sm disabled:border-gray-100 disabled:text-gray-300",
            danger: "bg-red-600 text-white shadow-lg shadow-red-600/10 hover:bg-red-700 hover:shadow-xl hover:-translate-y-0.5 border border-transparent",
            ghost: "bg-transparent text-gray-500 hover:text-dark hover:bg-gray-100 border border-transparent"
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
    ${ isDisabled ? 'opacity-70 cursor-not-allowed hover:transform-none hover:shadow-md' : '' } 
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

      if (to && !isDisabled) {
            return (
                  <Link to={to} className={finalClasses} {...props}>
                        {content}
                  </Link>
            );
      }

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