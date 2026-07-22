// filepath: frontend/src/components/Pagination.jsx
import Button from './ui/Button';

const Pagination = ({ page, pages, onPageChange }) => {
      if (!pages || pages <= 1) return null;

      const pageNumbers = [];

      // تحديد الصفحات التي ستظهر (الأولى، الأخيرة، والصفحات المجاورة للصفحة الحالية)
      for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                  pageNumbers.push(i);
            }
      }

      // إضافة النقاط المتتالية (...) للفجوات
      const paginationWithEllipsis = [];
      let prev;
      for (let i of pageNumbers) {
            if (prev) {
                  if (i - prev === 2) paginationWithEllipsis.push(prev + 1);
                  else if (i - prev !== 1) paginationWithEllipsis.push('...');
            }
            paginationWithEllipsis.push(i);
            prev = i;
      }

      return (
            <div className="mt-8 mb-4 flex justify-center items-center gap-2" dir="ltr">
                  {paginationWithEllipsis.map((item, index) => {
                        if (item === '...') {
                              return (
                                    <span key={`ellipsis-${ index }`} className="w-10 h-10 flex items-center justify-center text-gray-400 font-black">
                                          ...
                                    </span>
                              );
                        }

                        // 🌟 تحديد حالة الزر (هل هو الصفحة الحالية أم لا)
                        const isActive = item === page;

                        // 🌟 تخصيص ستايلات التمرير (Hover) بذكاء بناءً على الحالة
                        const customStyles = isActive
                              ? 'scale-110 shadow-lg !cursor-default hover:!bg-primary hover:!text-white hover:!-translate-y-0 hover:!shadow-primary/20'
                              : 'hover:!border-primary hover:!text-primary hover:!bg-primary/5';

                        return (
                              <Button
                                    key={item}
                                    onClick={() => {
                                          // منع إعادة التحميل إذا تم الضغط على نفس الصفحة
                                          if (!isActive) {
                                                onPageChange(item);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }
                                    }}
                                    variant={isActive ? 'primary' : 'outline'}
                                    size="sm"
                                    className={`w-10 h-10 sm:w-12 sm:h-12 !p-0 transition-all duration-300 ${ customStyles }`}
                              >
                                    {item}
                              </Button>
                        );
                  })}
            </div>
      );
};

export default Pagination;