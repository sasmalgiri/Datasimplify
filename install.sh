#!/bin/bash

# ============================================
# DataSimplify Quick Install Script
# ============================================

echo "🚀 DataSimplify Installation"
echo "============================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi
echo "✅ npm $(npm -v) found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi
echo "✅ Dependencies installed"

# Create .env.local if not exists
if [ ! -f .env.local ]; then
    echo ""
    echo "📝 Creating .env.local from template..."
    cp .env.example .env.local
    echo "✅ Created .env.local - please edit with your credentials"
else
    echo "✅ .env.local already exists"
fi

# Check Ollama (optional)
echo ""
echo "🤖 Checking Ollama (for AI features)..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama installed"
    
    # Check if models are available
    if ollama list 2>/dev/null | grep -q "nomic-embed-text"; then
        echo "✅ Embedding model ready"
    else
        echo "⚠️  Embedding model not found. Run: ollama pull nomic-embed-text"
    fi
    
    if ollama list 2>/dev/null | grep -q "llama3.2"; then
        echo "✅ Chat model ready"
    else
        echo "⚠️  Chat model not found. Run: ollama pull llama3.2"
    fi
else
    echo "⚠️  Ollama not installed (AI features will be limited)"
    echo "   Install with: curl -fsSL https://ollama.com/install.sh | sh"
fi

echo ""
echo "============================================"
echo "✅ Installation Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your credentials"
echo "2. Run: npm run dev"
echo "3. Open: http://localhost:3000"
echo ""
echo "Optional (for AI features):"
echo "- Start Ollama: ollama serve"
echo "- Pull models:  ollama pull nomic-embed-text && ollama pull llama3.2"
echo ""
echo "🚀 Happy Trading!"
