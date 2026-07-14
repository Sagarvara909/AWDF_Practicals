function Skills({ skillList }) {
  return (
    <section style={{ padding: '20px', margin: '20px' }}>
      <h2>Skills</h2>
      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {skillList.map((skill) => (
          <li key={skill} style={{ 
            padding: '10px', 
            margin: '8px 0', 
            backgroundColor: '#e0e0e0', 
            borderRadius: '4px',
            borderLeft: '4px solid #4CAF50'
          }}>
            {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default Skills;
