import { useState } from 'react';
import { createSession } from '../utils/api';
import useStore from '../state/store';
import useDeviceInfo from '../hooks/useDeviceInfo';

const UserInfoModal = ({ isOpen, onClose, onSubmit }) => {
  const sessionId = useStore((state) => state.sessionId);
  const deviceInfo = useDeviceInfo();
  
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(age) || age < 1 || age > 120) {
      newErrors.age = 'Please enter a valid age (1-120)';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Save user info to backend with complete device information
      await createSession({
        sessionId,
        // Basic device info
        userAgent: deviceInfo.userAgent,
        screenResolution: deviceInfo.screenResolution,
        deviceType: deviceInfo.deviceType,
        // Enhanced device metrics
        preferredTheme: deviceInfo.preferredTheme,
        viewportWidth: deviceInfo.viewportWidth,
        viewportHeight: deviceInfo.viewportHeight,
        highContrastMode: deviceInfo.highContrastMode,
        reducedMotionPreference: deviceInfo.reducedMotionPreference,
        devicePixelRatio: deviceInfo.devicePixelRatio,
        hardwareConcurrency: deviceInfo.hardwareConcurrency,
        pageLoadTime: deviceInfo.pageLoadTime,
        connectionType: deviceInfo.connectionType,
        memory: deviceInfo.memory,
        platform: deviceInfo.platform,
        language: deviceInfo.language,
        // User demographic info
        userInfo: {
          age: parseInt(formData.age),
          gender: formData.gender,
        },
      });

      // Call parent callback
      onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving user info:', error);
      setErrors({ submit: 'Failed to save information. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4 animate-fade-in">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">Welcome to Sensecheck Facility</h2>
          <p className="text-gray-400">
            Please provide some basic information before starting your assessment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Age Input */}
          <div>
            <label htmlFor="age" className="block text-sm font-semibold mb-2">
              Age <span className="text-red-400">*</span>
            </label>
            <input
              id="age"
              name="age"
              type="number"
              min="1"
              max="120"
              value={formData.age}
              onChange={handleChange}
              className={`input-field ${errors.age ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your age"
              autoFocus
            />
            {errors.age && (
              <p className="text-red-400 text-sm mt-1">{errors.age}</p>
            )}
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Gender <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['Male', 'Female', 'Other', 'Prefer not to say'].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleChange({ target: { name: 'gender', value: option } })}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.gender === option
                      ? 'bg-cyber-blue-500 border-cyber-blue-400 text-white'
                      : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {errors.gender && (
              <p className="text-red-400 text-sm mt-1">{errors.gender}</p>
            )}
          </div>

          {/* Privacy Notice */}
          <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2 text-cyan-300">🔒 Privacy Notice</h4>
            <p className="text-xs text-gray-300">
              Your information is collected anonymously for research purposes only. 
              No personal identifying information is stored. All data is secured and 
              will not be shared with third parties.
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full text-lg py-4"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <span className="loading-spinner mr-2"></span>
                Processing...
              </span>
            ) : (
              'Begin Assessment'
            )}
          </button>
        </form>

        {/* Required Fields Note */}
        <p className="text-center text-gray-500 text-xs mt-4">
          <span className="text-red-400">*</span> Required fields
        </p>
      </div>
    </div>
  );
};

export default UserInfoModal;

