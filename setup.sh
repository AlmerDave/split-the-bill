#!/bin/bash

# Split the Bill - Project Setup Script
# This script creates all necessary files and folders for the project

echo "🚀 Setting up Split the Bill project..."
echo ""

# Create project directory structure
echo "📁 Creating project structure..."
mkdir -p css js images

# Create placeholder files
echo "📄 Creating files..."

# Create empty placeholder files (you'll add content from the guide)
touch index.html
touch manifest.json
touch service-worker.js
touch README.md
touch css/styles.css
touch css/responsive.css
touch js/app.js
touch js/calculator.js
touch js/export.js

echo "✅ Project structure created!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the HTML content into index.html"
echo "2. Copy the CSS content into css/styles.css and css/responsive.css"
echo "3. Copy the JavaScript content into js/ files"
echo "4. Copy manifest.json and service-worker.js content"
echo "5. Generate icons (192x192 and 512x512) and place in images/ folder"
echo "6. Test locally using a local server"
echo "7. Push to GitHub and enable GitHub Pages"
echo ""
echo "📚 See DEVELOPER_GUIDE.md for complete instructions!"
echo ""

# Display project structure
echo "📂 Project structure:"
tree -L 2 2>/dev/null || find . -type d -o -type f | grep -v ".git" | head -20

echo ""
echo "✨ Setup complete! Happy coding! 💻"