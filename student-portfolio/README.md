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
