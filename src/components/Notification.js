import React, { useEffect } from 'react';
import '../styles/Notification.css';

function Notification({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // A notificação desaparece após 3 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type} fade-in`}>
      {message}
    </div>
  );
}

export default Notification; 