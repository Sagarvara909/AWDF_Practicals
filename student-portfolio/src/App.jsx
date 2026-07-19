import { useState } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './components/Home'
import Projects from './components/Projects'
import Contact from './components/Contact'
import NotFound from './components/NotFound'
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
    <div className={isDarkMode ? 'app dark' : 'app light'} style={{ fontFamily: 'Arial, sans-serif' }}>
      <Header name={studentName} themeColor={isDarkMode ? '#2c3e50' : '#4CAF50'} />

      <nav style={{ backgroundColor: isDarkMode ? '#1f2937' : '#f1f1f1', padding: '12px 20px', display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: isDarkMode ? '#fff' : '#333', textDecoration: 'none', fontWeight: 'bold' }}>Home</Link>
        <Link to="/projects" style={{ color: isDarkMode ? '#fff' : '#333', textDecoration: 'none', fontWeight: 'bold' }}>Projects</Link>
        <Link to="/contact" style={{ color: isDarkMode ? '#fff' : '#333', textDecoration: 'none', fontWeight: 'bold' }}>Contact</Link>
        <button
          onClick={() => setIsDarkMode((prev) => !prev)}
          style={{ border: 'none', borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', backgroundColor: isDarkMode ? '#f1f1f1' : '#333', color: isDarkMode ? '#333' : '#fff' }}
        >
          {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      <Routes>
        <Route path="/" element={<Home skillsList={skillsList} />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />
    </div>
  )
}

export default App
