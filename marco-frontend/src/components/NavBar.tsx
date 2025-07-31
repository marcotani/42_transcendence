import { Link } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="bg-blue-700 text-white p-4 flex space-x-4">
      <Link to="/" className="hover:underline">
        Home
      </Link>
      <Link to="/login" className="hover:underline">
        Login
      </Link>
      <Link to="/register" className="hover:underline">
        Register
      </Link>
      <Link to="/matchmaking" className="hover:underline">
        Matchmaking
      </Link>
      <Link to="/game" className="hover:underline">
        Game
      </Link>
      <Link to="/profile" className="hover:underline">
        Profile
      </Link>
    </nav>
  );
}
