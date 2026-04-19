import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DemoStatus = () => {
  const { user, logout } = useAuth();
  const [demoInfo, setDemoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoTimeLeft, setDemoTimeLeft] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const cardRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const intervalRef = useRef(null);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (user && user.is_demo) {
      fetchDemoInfo();
      // Check demo status every minute
      intervalRef.current = setInterval(fetchDemoInfo, 60000);
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [user]);

  const fetchDemoInfo = async () => {
    try {
      const response = await axios.get('/demo/info');
      setDemoInfo(response.data);

      // If demo is expired, logout
      if (!response.data.is_active) {
        alert('Your demo session has expired. Contact admin for full access.');
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch demo info:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  // Calculate remaining demo time
  const calculateDemoTime = () => {
    if (!user?.expires_at) return null;

    const now = new Date();
    const expiresAt = new Date(user.expires_at);
    const diffMs = expiresAt - now;

    if (diffMs <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

    return { hours, minutes, seconds, expired: false };
  };

  useEffect(() => {
    if (user?.is_demo) {
      const updateDemoTime = () => {
        const timeLeft = calculateDemoTime();
        setDemoTimeLeft(timeLeft);

        if (timeLeft?.expired) {
          logout();
        }
      };

      updateDemoTime();
      const timer = setInterval(updateDemoTime, 1000);

      return () => clearInterval(timer);
    }
  }, [user, logout]);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (!cardRef.current) return;
    setIsDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    e.preventDefault();
  };

  const handleTouchStart = (e) => {
    if (!cardRef.current) return;
    setIsDragging(true);
    const rect = cardRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    dragOffsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      if (!cardRef.current) return;
      const newX = e.clientX - dragOffsetRef.current.x;
      const newY = e.clientY - dragOffsetRef.current.y;

      // Keep card within viewport
      const cardWidth = isMobile ? 150 : 300;
      const cardHeight = isMobile ? 80 : 120;
      const viewportWidth = document.documentElement.clientWidth;
      const constrainedX = Math.max(0, Math.min(newX, viewportWidth - cardWidth));
      const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - cardHeight));

      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleTouchMove = (e) => {
      if (!cardRef.current) return;
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffsetRef.current.x;
      const newY = touch.clientY - dragOffsetRef.current.y;

      // Keep card within viewport
      const cardWidth = isMobile ? 130 : 300;
      const cardHeight = isMobile ? 80 : 120;
      const viewportWidth = document.documentElement.clientWidth;
      const constrainedX = Math.max(0, Math.min(newX, viewportWidth - cardWidth));
      const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - cardHeight));

      setPosition({ x: constrainedX, y: constrainedY });
      e.preventDefault();
    };

    const handleMouseUp = () => {
      setIsDragging(false);

      // Auto-snap to left or right side
      const cardWidth = isMobile ? 130 : 300; // Increased to account for padding/borders
      const viewportWidth = document.documentElement.clientWidth;
      const centerX = position.x + (cardWidth / 2);
      const snapToLeft = centerX < viewportWidth / 2;

      const snappedX = snapToLeft ? 10 : Math.max(10, viewportWidth - cardWidth - 20);
      const clampedY = Math.max(10, Math.min(position.y, window.innerHeight - (isMobile ? 80 : 120)));

      setPosition({ x: snappedX, y: clampedY });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);

      // Auto-snap to left or right side
      const cardWidth = isMobile ? 140 : 300; // Increased to account for padding/borders
      const viewportWidth = document.documentElement.clientWidth;
      const centerX = position.x + (cardWidth / 2);
      const snapToLeft = centerX < viewportWidth / 2;

      const snappedX = snapToLeft ? 10 : Math.max(10, viewportWidth - cardWidth - 20);
      const clampedY = Math.max(10, Math.min(position.y, window.innerHeight - (isMobile ? 80 : 120)));

      setPosition({ x: snappedX, y: clampedY });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, position, isMobile]);

  if (!user || !user.is_demo || loading || !demoTimeLeft) {
    return null;
  }

  const getTimeLeftText = () => {
    if (!demoTimeLeft) return '';
    
    if (demoTimeLeft.expired) return 'Session Expired';
    
    const { hours, minutes, seconds } = demoTimeLeft;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s left`;
    } else if (minutes > 0) {
      return `${minutes}m ${String(seconds).padStart(2, '0')}s left`;
    }
    return `${String(seconds).padStart(2, '0')}s left`;
  };

  const getStatusColor = () => {
    if (!demoTimeLeft) return { border: '#4caf50', text: '#4caf50', bg: '#e8f5e9' };
    
    if (demoTimeLeft.expired) {
      return { border: '#dc3545', text: '#dc3545', bg: '#ffebee' };
    }
    
    const totalSeconds = demoTimeLeft.hours * 3600 + demoTimeLeft.minutes * 60 + demoTimeLeft.seconds;
    
    // Red if less than 5 minutes
    if (totalSeconds < 300) {
      return { border: '#dc3545', text: '#dc3545', bg: '#ffebee' };
    }
    // Yellow if less than 1 hour
    if (totalSeconds < 3600) {
      return { border: '#ffc107', text: '#f57f17', bg: '#fffde7' };
    }
    // Green otherwise
    return { border: '#4caf50', text: '#2e7d32', bg: '#e8f5e9' };
  };

  // Mobile mini card view
  if (isMobile) {
    const colors = getStatusColor();
    return (
      <div
        ref={cardRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          minWidth: '140px',
          transition: isDragging ? 'none' : 'all 0.3s ease',
          touchAction: 'none', // Prevent scrolling when dragging
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: '4px' }}>
          🚀 Demo Mode
        </div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: colors.text, textAlign: 'center' }}>
          {getTimeLeftText()}
        </div>
      </div>
    );
  }

  // Desktop full card view
  const colors = getStatusColor();
  return (
    <div
      ref={cardRef}
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '14px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        zIndex: 9999,
        maxWidth: '300px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '18px' }}>🚀</span>
        <span style={{ fontWeight: 'bold', color: colors.text, fontSize: '14px' }}>
          Demo Mode
        </span>
      </div>
      <div style={{ color: colors.text, fontSize: '13px', marginBottom: '6px', fontWeight: '500' }}>
        Time remaining: {getTimeLeftText()}
      </div>
      <div style={{ color: colors.text, fontSize: '12px', opacity: 0.8 }}>
        All data will be deleted when demo expires
      </div>
    </div>
  );
};

export default DemoStatus;