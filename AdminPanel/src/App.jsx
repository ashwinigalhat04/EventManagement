import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Award, Receipt, LogOut, Loader2, Search } from 'lucide-react';
import api from './api';

// Minimal Dashboard Page
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then(res => {
      setStats(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex-center" style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}><Loader2 className="animate-spin" size={48} color="#8B5CF6"/></div>

  return (
    <div className="animate-fade-in">
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px'}}>
        <div className="glass-card" style={{padding:'24px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
            <h3 style={{color:'var(--text-muted)', fontSize:'14px'}}>Total Revenue</h3>
            <Receipt size={20} color="var(--accent-green)" />
          </div>
          <div style={{fontSize:'32px', fontWeight:'800'}}>₹{stats?.totalRevenue || 0}</div>
          <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'8px'}}>
            Memberships: ₹{stats?.membershipRevenue || 0} | Events: ₹{stats?.eventRevenue || 0}
          </div>
        </div>

        <div className="glass-card" style={{padding:'24px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
            <h3 style={{color:'var(--text-muted)', fontSize:'14px'}}>Total Students</h3>
            <Users size={20} color="var(--primary)" />
          </div>
          <div style={{fontSize:'32px', fontWeight:'800'}}>{stats?.totalMembers || 0}</div>
          <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'8px'}}>
            Active Paid Members: {stats?.paidVsUnpaid?.paid || 0}
          </div>
        </div>

        <div className="glass-card" style={{padding:'24px'}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:'16px'}}>
            <h3 style={{color:'var(--text-muted)', fontSize:'14px'}}>Platform Events</h3>
            <Calendar size={20} color="var(--accent-yellow)" />
          </div>
          <div style={{fontSize:'32px', fontWeight:'800'}}>{stats?.totalEvents || 0}</div>
          <div style={{fontSize:'12px', color:'var(--text-muted)', marginTop:'8px'}}>
            Active / Upcoming: {stats?.activeEvents || 0}
          </div>
        </div>
      </div>

      <h2 style={{marginBottom:'20px'}}>Event Seat Utilization</h2>
      <div className="glass-card table-container">
        <table>
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Registrations</th>
              <th>Attendance</th>
              <th>Seat Utilization</th>
              <th>Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {(stats?.seatUtilization || []).map((ev, i) => (
              <tr key={i}>
                <td style={{fontWeight:'600'}}>{ev.title}</td>
                <td>{ev.registrations}</td>
                <td>{ev.attendance}</td>
                <td>
                  <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                    <div style={{flex:1, height:'6px', background:'var(--bg-dark)', borderRadius:'3px'}}>
                      <div style={{height:'100%', width:`${ev.utilizationPct}%`, background:'var(--primary)', borderRadius:'3px'}}></div>
                    </div>
                    <span style={{fontSize:'12px', color:'var(--text-muted)'}}>{ev.utilizationPct}%</span>
                  </div>
                </td>
                <td>{ev.avgRating > 0 ? `⭐ ${ev.avgRating}` : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Login Page
const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Reusing endpoint from backend, admin logs in via same route if seeded
      const res = await api.post('/auth/login', { email, password });
      if(res.data.user.role === 'ADMIN') {
        localStorage.setItem('adminToken', res.data.token);
        setAuth(true);
      } else {
        setError('Access denied. Admins only.');
      }
    } catch(err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="glass-card" style={{padding:'40px', width:'100%', maxWidth:'400px'}}>
        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <div className="sidebar-logo" style={{margin:'0 auto 16px auto'}}>P</div>
          <h2>PICSEL Admin</h2>
          <p style={{color:'var(--text-muted)', fontSize:'14px', marginTop:'8px'}}>Enter your credentials</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          {error && <div className="badge badge-red" style={{display:'block', textAlign:'center', marginBottom:'16px'}}>{error}</div>}
          <button type="submit" className="btn btn-primary" style={{width:'100%'}}>Sign In</button>
        </form>
      </div>
    </div>
  )
}

const AppLayout = ({ setAuth }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setAuth(false);
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Events', path: '/events', icon: Calendar },
    { name: 'Certificates', path: '/certificates', icon: Award },
    { name: 'Reports', path: '/reports', icon: Receipt },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">P</div>
          <div className="sidebar-brand">PICSEL ERP</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} className={`nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-outline" style={{width:'100%', color:'var(--accent-red)', borderColor:'rgba(239, 68, 68, 0.3)'}}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="page-title">
            {navItems.find(i => i.path === location.pathname)?.name || 'Admin'}
          </div>
          <div className="user-profile">
            <span style={{fontSize:'14px', fontWeight:'600'}}>Super Admin</span>
            <div className="avatar"><Users size={20} color="var(--primary)" /></div>
          </div>
        </header>
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<div className="glass-card" style={{padding:'40px',textAlign:'center'}}><h2>Coming Soon</h2><p style={{color:'var(--text-muted)'}}>This module is under development</p></div>} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('adminToken'));

  return (
    <Router>
      {!isAuthenticated ? (
         <Login setAuth={setIsAuthenticated} />
      ) : (
         <AppLayout setAuth={setIsAuthenticated} />
      )}
    </Router>
  )
}
