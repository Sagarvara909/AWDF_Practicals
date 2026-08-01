import About from './About'
import Skills from './Skills'

function Home({ skillsList }) {
  return (
    <main>
      <About />
      <Skills skillList={skillsList} />
    </main>
  )
}

export default Home
