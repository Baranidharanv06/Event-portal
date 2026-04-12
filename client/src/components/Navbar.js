import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch('http://localhost:5001/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/events">EventPortal</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <Link className="nav-link" to="/events">Events</Link>
            </li>
            {user ? (
              <>
                {user.role === 'student' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/my-registrations">My Registrations</Link>
                  </li>
                )}
                {user.role === 'organizer' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/organizer">My Dashboard</Link>
                  </li>
                )}
                {user.role === 'coordinator' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/coordinator">My Dashboard</Link>
                  </li>
                )}
                {user.role === 'admin' && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin">Admin</Link>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">Profile</Link>
                </li>
                <li className="nav-item ms-2">
                  <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                    Logout ({user.name})
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/signup">Signup</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;