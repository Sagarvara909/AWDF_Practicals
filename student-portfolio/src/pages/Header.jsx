function Header({ name, themeColor }) {
  return (
    <header className="site-header" style={{ backgroundColor: themeColor || '#4CAF50' }}>
      <div className="header-inner">
        <h1>{name}</h1>
        <p>Student Portfolio</p>
      </div>
    </header>
  )
}

export default Header;
