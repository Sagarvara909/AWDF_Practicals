import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Header from './pages/Header'
import Footer from './pages/Footer'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Contact from './pages/Contact'
import Task from './pages/task'
import NotFound from './pages/NotFound'
import './App.css'

function App() {
  const studentName = 'Sagar Vara'
  const [isDarkMode, setIsDarkMode] = useState(false)

  const skillsList = [
    'HTML & CSS',
    'JavaScript ES6+',
    'React & Hooks',
    'Vite Build Tool',
    'Component Architecture',
    'Props & State Management',
    'Git & Version Control',
    'Responsive Web Design',
    'Data Analytics',
    'Data Visualization',
    'SQL & Database Management',
    'Machine Learning',
    'Python Programming',
    'Data Cleaning & Preprocessing',
    'Statistical Analysis',
    'Data Mining Techniques',
    'Predictive Modeling',
    'Data Interpretation & Reporting',
    'Big Data Technologies',
    'Data Warehousing',
  ]

  return (
    <div className={isDarkMode ? 'app dark' : 'app light'}>
      <Header name={studentName} themeColor={isDarkMode ? '#08039d' : '#4CAF50'} />

      <nav className="site-nav">
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/projects" className="nav-link">
            Projects
          </Link>
          <Link to="/task" className="nav-link">
            Task Manager
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
        </div>

        <button className="theme-btn" onClick={() => setIsDarkMode((prev) => !prev)}>
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home skillsList={skillsList} />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/task" element={<Task />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App
