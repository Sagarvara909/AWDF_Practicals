import Header from './components/Header'
import About from './components/About'
import Skills from './components/Skills'
import Footer from './components/Footer'
import './App.css'

function App() {
  const studentName = 'Sagar Vara'
  const themeColor = '#4CAF50'
  
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
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <Header name={studentName} themeColor={themeColor} />
      <About />
      <Skills skillList={skillsList} />
      <Footer />
    </div>
  )
}

export default App
