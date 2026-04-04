import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:  "AIzaSyAjHkIwlzKvpFHaNMFYCV4mlg1M-w1oFes",
  authDomain: "my-very-own-project-f5cae.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();