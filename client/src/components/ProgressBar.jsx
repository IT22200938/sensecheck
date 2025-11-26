const ProgressBar = ({ current, total, label }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full mb-6">
      {label && (
        <div className="flex justify-between text-sm text-gray-300 mb-2">
          <span>{label}</span>
          <span>{current} / {total}</span>
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyber-blue-500 to-cyber-purple-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

