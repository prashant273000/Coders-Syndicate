import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../firebase";

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const logout = async () => {
  await signOut(auth);
  window.location.href = "/";
};