import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { logout } from "../services/auth";

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) return <h2>Loading...</h2>;

  return (
    <div>
      <h2>Profile</h2>
      <p>{user.displayName}</p>
      <p>{user.email}</p>
      <img src={user.photoURL} width="100" />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default Profile;