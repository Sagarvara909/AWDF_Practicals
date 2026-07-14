function Header({ name, themeColor }) {
  return (
    <header style={{ backgroundColor: themeColor || '#4CAF50', color: 'white', padding: '20px', textAlign: 'center' }}>
      <h1>{name}</h1>
      <p>Student Portfolio</p>
    </header>
  );
}

export default Header;
