import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';
import { startRingtone, stopRingtone, unlockAudio } from '../utils/ringtoneAudio';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, mechanic } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    setSocket(newSocket);

    const emitJoin = () => {
      if (user) {
        let mechId = mechanic ? mechanic._id : null;
        if (!mechId) {
          try {
            const savedMech = JSON.parse(localStorage.getItem('highway_rescue_mechanic') || 'null');
            if (savedMech && savedMech._id) mechId = savedMech._id;
          } catch (e) {}
        }
        newSocket.emit('join', {
          userId: user._id,
          role: user.role,
          mechanicId: mechId,
        });
        console.log('[Socket] Emitted join:', { userId: user._id, role: user.role, mechanicId: mechId });
      }
    };

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server:', newSocket.id);
      emitJoin();
    });

    // If socket was already connected when user/mechanic loaded
    if (newSocket.connected) {
      emitJoin();
    }

    // Real-time listener for customer booking status update
    newSocket.on('bookingStatusUpdated', (data) => {
      const status = data.status || data.booking?.status;
      const message = data.message || `Booking status updated to ${status}`;
      toast.info(`🔔 ${message}`, {
        position: 'top-right',
        autoClose: 6000,
      });
    });

    // Real-time listener when a mechanic accepts a customer's request
    newSocket.on('bookingAccepted', (data) => {
      stopRingtone();
      toast.success(`🎉 ${data.message || 'A mechanic has accepted your roadside assistance request!'}`, {
        position: 'top-right',
        autoClose: 7000,
      });
    });

    // Real-time listener for booking taken by someone else
    newSocket.on('bookingTaken', () => {
      stopRingtone();
    });

    // Real-time listener for booking cancelled by customer
    newSocket.on('bookingCancelled', () => {
      stopRingtone();
    });

    // Real-time listener for mechanics receiving a new request
    newSocket.on('newBookingRequest', (data) => {
      const isEmergency = data.isEmergency;
      const title = isEmergency ? '🚨 URGENT EMERGENCY BREAKDOWN!' : '🔧 New Roadside Service Request';

      // Ring loud repeating dispatch alert tone immediately
      startRingtone();

      toast.warn(
        <div>
          <strong>{title}</strong>
          <div>{data.message || 'A driver needs roadside assistance nearby.'}</div>
          {data.distanceKm && <small>Approx: {data.distanceKm} km away</small>}
        </div>,
        {
          position: 'top-right',
          autoClose: isEmergency ? 12000 : 8000,
        }
      );
    });

    return () => {
      stopRingtone();
      newSocket.disconnect();
    };
  }, [user?._id, mechanic?._id]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
