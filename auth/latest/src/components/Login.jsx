import { loginWithGoogle } from "../services/auth";

const Login = () => {
  const handleLogin = async () => {
    const user = await loginWithGoogle();
    const token = await user.getIdToken();

    await fetch("http://localhost:5000/api/auth", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    window.location.href = "/profile";
  };

  return (
    <div>
      <h2>Login</h2>
      <button onClick={handleLogin}>
        Continue with Google
      </button>
    </div>
  );
};

export default Login;