import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const Rating = ({ value, text, color = "text-amber-500" }) => {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex text-sm sm:text-base ${color}`}>
        {[1, 2, 3, 4, 5].map((index) => (
          <span key={index}>
            {value >= index ? (
              <FaStar />
            ) : value >= index - 0.5 ? (
              <FaStarHalfAlt />
            ) : (
              <FaRegStar />
            )}
          </span>
        ))}
      </div>
      {text && <span className="text-xs sm:text-sm font-bold text-gray-500">{text}</span>}
    </div>
  );
};

export default Rating;