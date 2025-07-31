import { Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Matchmaking from './pages/Matchmaking';
import Game from './pages/Game';
import Profile from './pages/Profile';
import NavBar from './components/NavBar';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <NavBar />
      <main className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/matchmaking" element={<Matchmaking />} />
          <Route path="/game" element={<Game />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </div>
  );
}
