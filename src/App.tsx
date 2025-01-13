import React from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <Dashboard />
        </main>
      </div>
    </div>
  )
}

export default App
