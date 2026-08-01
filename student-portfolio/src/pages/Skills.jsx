function Skills({ skillList }) {
  return (
    <section className="page-card">
      <h2>Skills</h2>
      <ul className="skill-list">
        {skillList.map((skill) => (
          <li key={skill} className="skill-item">
            {skill}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default Skills;
