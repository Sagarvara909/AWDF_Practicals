function Projects() {
  const projects = [
    {
      title: 'Student Portfolio Website',
      description: 'A responsive personal portfolio built with React, Vite, and modern styling.',
    },
    {
      title: 'React State Dashboard',
      description: 'A small interactive app demonstrating controlled inputs and dynamic UI updates.',
    },
    {
      title: 'Responsive Landing Page',
      description: 'A clean landing page focused on accessibility and mobile-friendly layouts.',
    },
  ]

  return (
    <section style={{ padding: '20px', margin: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h2>Projects</h2>
      <p>Here are a few projects that reflect my growing web development skills.</p>
      {projects.map((project, index) => (
        <article key={index} style={{ marginTop: '15px', padding: '15px', backgroundColor: 'white', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}>
          <h3 style={{ color: '#4CAF50' }}>{project.title}</h3>
          <p>{project.description}</p>
        </article>
      ))}
    </section>
  )
}

export default Projects
