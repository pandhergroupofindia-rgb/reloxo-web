'use client';

import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "./LoginModal";

export function GlobalLoginModal() {
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  return (
    <LoginModal 
      isOpen={isLoginModalOpen} 
      onClose={closeLoginModal} 
    />
  );
}
