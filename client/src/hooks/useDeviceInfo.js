import { useState, useEffect } from 'react';

/**
 * Custom hook to gather comprehensive device and environment information
 */
const useDeviceInfo = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    userAgent: '',
    screenResolution: { width: 0, height: 0 },
    deviceType: 'desktop',
    pixelRatio: 1,
    touchSupport: false,
    // Extended info
    viewportWidth: 0,
    viewportHeight: 0,
    devicePixelRatio: 1,
    hardwareConcurrency: 0,
    preferredTheme: 'light',
    highContrastMode: false,
    reducedMotionPreference: false,
    pageLoadTime: 0,
  });

  useEffect(() => {
    const detectDeviceType = () => {
      const ua = navigator.userAgent;
      if (/mobile/i.test(ua)) return 'mobile';
      if (/tablet|ipad/i.test(ua)) return 'tablet';
      return 'desktop';
    };

    // Detect preferred theme
    const getPreferredTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    };

    // Detect high contrast mode
    const getHighContrastMode = () => {
      if (window.matchMedia) {
        return window.matchMedia('(prefers-contrast: high)').matches;
      }
      return false;
    };

    // Detect reduced motion preference
    const getReducedMotion = () => {
      if (window.matchMedia) {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      }
      return false;
    };

    // Calculate page load time
    const getPageLoadTime = () => {
      if (performance.timing) {
        return performance.timing.loadEventEnd - performance.timing.navigationStart;
      }
      return 0;
    };

    setDeviceInfo({
      userAgent: navigator.userAgent,
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height,
      },
      deviceType: detectDeviceType(),
      pixelRatio: window.devicePixelRatio || 1,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      
      // Extended information
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      preferredTheme: getPreferredTheme(),
      highContrastMode: getHighContrastMode(),
      reducedMotionPreference: getReducedMotion(),
      pageLoadTime: getPageLoadTime(),
      
      // Additional capabilities
      maxTouchPoints: navigator.maxTouchPoints || 0,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      memory: navigator.deviceMemory || 'unknown',
      platform: navigator.platform || 'unknown',
      language: navigator.language || 'unknown',
    });

    // Listen for viewport resize
    const handleResize = () => {
      setDeviceInfo(prev => ({
        ...prev,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }));
    };

    // Listen for theme changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      setDeviceInfo(prev => ({
        ...prev,
        preferredTheme: e.matches ? 'dark' : 'light',
      }));
    };

    window.addEventListener('resize', handleResize);
    darkModeQuery.addEventListener('change', handleThemeChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      darkModeQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  return deviceInfo;
};

export default useDeviceInfo;

