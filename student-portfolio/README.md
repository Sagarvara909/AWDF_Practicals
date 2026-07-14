# Student Portfolio - React + Vite

A modern, reusable component-based portfolio application built with React and Vite as part of ITUE301 (Advanced Web Development Frameworks) Practical 1.

## Project Overview

This project demonstrates best practices in React component architecture by creating a multi-component portfolio page with:
- Independent, reusable components
- Props-based data flow
- Proper component composition
- Clean, maintainable code structure

## Project Structure

```
student-portfolio/
├── src/
│   ├── components/
│   │   ├── Header.jsx       # Site header with name and theme
│   │   ├── About.jsx        # About section
│   │   ├── Skills.jsx       # Skills list (accepts props)
│   │   └── Footer.jsx       # Footer with contact info
│   ├── App.jsx              # Main app component (composition)
│   ├── App.css              # Application styles
│   ├── index.css            # Global styles
│   └── main.jsx             # Entry point
├── package.json
├── vite.config.js
└── index.html
```

## Components

### Header Component
- **Props**: `name`, `themeColor`
- **Description**: Displays the portfolio title and student name
- **Features**: Responsive header with gradient background

### About Component
- **Props**: None (static content)
- **Description**: Shows a brief bio section
- **Features**: Self-contained about section with styled background

### Skills Component
- **Props**: `skillList` (array of skill strings)
- **Description**: Renders a dynamic list of skills
- **Features**: Maps through array to display each skill with styling

### Footer Component
- **Props**: None (static content)
- **Description**: Display contact and copyright information
- **Features**: Footer with dark background and border

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm

### Installation Steps

1. **Navigate to project directory**
   ```bash
   cd student-portfolio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173/`

## Key Concepts Demonstrated

### 1. Component Architecture
- Single responsibility principle: Each component has one clear purpose
- Composable: Components are combined in App.jsx

### 2. Props Usage
- `Header` receives `name` and `themeColor` props
- `Skills` receives `skillList` array prop
- Demonstrates parent-to-child data flow

### 3. Reusability
- Each component is independent and can be reused
- No logic duplication across components
- Styles are scoped and applied inline for portability

### 4. JSX Syntax
- JavaScript expressions embedded in markup
- Array mapping for dynamic rendering
- Conditional styling with inline styles

## Customization

### Update Your Name
Edit `src/App.jsx`:
```javascript
const studentName = 'Your Name'
```

### Add/Update Skills
Edit the `skillsList` array in `src/App.jsx`:
```javascript
const skillsList = [
  'Skill 1',
  'Skill 2',
  'Skill 3',
  // ... add more skills
]
```

### Change Theme Color
Edit the `themeColor` in `src/App.jsx`:
```javascript
const themeColor = '#4CAF50'  // Change to any hex color
```

### Update About Section
Edit content in `src/components/About.jsx`

### Update Footer Information
Edit contact info in `src/components/Footer.jsx`

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Project Learning Outcomes

After completing this practical, students will be able to:
- ✅ Set up a React project using Vite
- ✅ Create reusable functional components
- ✅ Pass data between components using props
- ✅ Compose multiple components into a single-page layout
- ✅ Apply CSS styling to React components
- ✅ Use JSX syntax effectively
- ✅ Understand component lifecycle and re-rendering

## Technologies Used

- **React 18+**: UI library
- **Vite**: Build tool and dev server
- **CSS3**: Styling and responsive design
- **JavaScript ES6+**: Modern JavaScript features

## Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 5174
```

### Module Not Found Errors
Ensure all imports match the component file names and paths.

### Props Not Displaying
- Verify prop names match between parent and child
- Check browser console for errors
- Use React DevTools to inspect component props

