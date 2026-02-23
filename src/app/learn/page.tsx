'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { BookOpen, Clock, GraduationCap, ArrowRight } from 'lucide-react';

const PLANNED_COURSES = [
  {
    emoji: '🔰',
    title: 'Crypto Basics',
    description: 'What cryptocurrency is, how Bitcoin and Ethereum work, and how to get started safely.',
    level: 'Beginner',
    lessons: 5,
    color: 'emerald',
  },
  {
    emoji: '📊',
    title: 'Understanding Markets',
    description: 'Reading price charts, market cap, bull vs bear markets, and the Fear & Greed Index.',
    level: 'Beginner',
    lessons: 5,
    color: 'blue',
  },
  {
    emoji: '💼',
    title: 'Building a Portfolio',
    description: 'Diversification, risk management, portfolio allocation, and crypto tax basics.',
    level: 'Intermediate',
    lessons: 5,
    color: 'purple',
  },
  {
    emoji: '🎯',
    title: 'Advanced Strategies',
    description: 'DeFi, staking, whale tracking, on-chain analysis, and NFTs explained.',
    level: 'Advanced',
    lessons: 5,
    color: 'amber',
  },
];

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <GraduationCap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Crypto Academy</h1>
          <p className="text-lg text-gray-400 mb-2">
            Free educational courses to learn cryptocurrency from scratch.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm mt-4">
            <Clock className="w-4 h-4" />
            Courses are being written — check back soon
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Planned courses */}
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          Planned Courses
        </h2>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          {PLANNED_COURSES.map((course) => (
            <div
              key={course.title}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6"
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{course.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white">{course.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      course.level === 'Beginner' ? 'bg-emerald-500/20 text-emerald-400' :
                      course.level === 'Intermediate' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {course.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{course.description}</p>
                  <p className="text-xs text-gray-500">{course.lessons} lessons planned</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Available now */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">Available Now: Crypto Glossary</h2>
              <p className="text-gray-400 text-sm">
                100+ crypto terms explained in simple English — from HODL to DeFi.
              </p>
            </div>
            <Link
              href="/glossary"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shrink-0"
            >
              Open Glossary
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
