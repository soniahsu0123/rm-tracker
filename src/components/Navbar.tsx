'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { LayoutDashboard, FolderOpen, Users, LogOut } from 'lucide-react'

interface NavbarProps {
  profile: Profile
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: '總覽', icon: LayoutDashboard },
    { href: '/projects', label: '專案', icon: FolderOpen },
    ...(profile.role === 'manager' || profile.role === 'admin' ? [{ href: '/admin', label: '成員', icon: Users }] : []),
  ]

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <span className="font-bold text-indigo-600 text-sm">RM Tracker</span>
            <div className="flex items-center gap-1">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    pathname === href
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{profile.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
