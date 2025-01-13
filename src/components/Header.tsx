import React from 'react'
import { RocketIcon } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center space-x-2">
          <RocketIcon className="h-6 w-6" />
          <span className="font-bold">3MG Roofing</span>
        </div>
      </div>
    </header>
  )
} 