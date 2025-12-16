'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProgressBar, BeginnerTip } from '@/components/ui/BeginnerHelpers';

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface Course {
  id: string;
  title: string;
  emoji: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons: Lesson[];
  progress: number;
}

export default function LearnPage() {
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

  const courses: Course[] = [
    {
      id: 'basics',
      title: 'Crypto Basics',
      emoji: '🔰',
      description: 'Start here! Learn what cryptocurrency is and how it works.',
      level: 'beginner',
      progress: 40,
      lessons: [
        { id: '1', title: 'What is Cryptocurrency?', description: 'Understand the basics of digital money', duration: '5 min', completed: true, locked: false },
        { id: '2', title: 'What is Bitcoin?', description: 'Learn about the first and largest cryptocurrency', duration: '5 min', completed: true, locked: false },
        { id: '3', title: 'What is Ethereum?', description: 'Discover the "world computer"', duration: '5 min', completed: false, locked: false },
        { id: '4', title: 'How to Buy Crypto', description: 'Step-by-step guide to your first purchase', duration: '8 min', completed: false, locked: false },
        { id: '5', title: 'Keeping Your Crypto Safe', description: 'Wallet security essentials', duration: '10 min', completed: false, locked: false },
      ]
    },
    {
      id: 'market',
      title: 'Understanding Markets',
      emoji: '📊',
      description: 'Learn to read charts and understand market movements.',
      level: 'beginner',
      progress: 0,
      lessons: [
        { id: '1', title: 'What is Market Cap?', description: 'Understand how crypto is valued', duration: '4 min', completed: false, locked: false },
        { id: '2', title: 'Reading Price Charts', description: 'Basic chart reading skills', duration: '8 min', completed: false, locked: false },
        { id: '3', title: 'Bull vs Bear Markets', description: 'Market cycles explained', duration: '6 min', completed: false, locked: true },
        { id: '4', title: 'Understanding Volatility', description: 'Why crypto moves so much', duration: '5 min', completed: false, locked: true },
        { id: '5', title: 'Fear & Greed Index', description: 'Measuring market sentiment', duration: '5 min', completed: false, locked: true },
      ]
    },
    {
      id: 'portfolio',
      title: 'Building a Portfolio',
      emoji: '💼',
      description: 'Learn how to create and manage a crypto portfolio.',
      level: 'intermediate',
      progress: 0,
      lessons: [
        { id: '1', title: 'What is Diversification?', description: 'Don\'t put all eggs in one basket', duration: '5 min', completed: false, locked: false },
        { id: '2', title: 'Risk Management 101', description: 'Protect your investment', duration: '8 min', completed: false, locked: true },
        { id: '3', title: 'Portfolio Allocation', description: 'How much in each coin?', duration: '7 min', completed: false, locked: true },
        { id: '4', title: 'When to Rebalance', description: 'Maintaining your portfolio', duration: '6 min', completed: false, locked: true },
        { id: '5', title: 'Tax Considerations', description: 'Crypto taxes explained simply', duration: '10 min', completed: false, locked: true },
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Strategies',
      emoji: '🎯',
      description: 'Learn about DeFi, staking, and more advanced topics.',
      level: 'advanced',
      progress: 0,
      lessons: [
        { id: '1', title: 'What is DeFi?', description: 'Decentralized finance explained', duration: '8 min', completed: false, locked: true },
        { id: '2', title: 'Staking & Yield', description: 'Earn passive income', duration: '10 min', completed: false, locked: true },
        { id: '3', title: 'Understanding Whale Activity', description: 'Track smart money', duration: '8 min', completed: false, locked: true },
        { id: '4', title: 'On-Chain Analysis', description: 'Read blockchain data', duration: '12 min', completed: false, locked: true },
        { id: '5', title: 'NFTs Explained', description: 'Digital collectibles', duration: '8 min', completed: false, locked: true },
      ]
    },
  ];

  const totalLessons = courses.reduce((sum, c) => sum + c.lessons.length, 0);
  const completedLessons = courses.reduce((sum, c) => sum + c.lessons.filter(l => l.completed).length, 0);
  const overallProgress = Math.round((completedLessons / totalLessons) * 100);

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">📚 Crypto Academy</h1>
          <p className="text-xl text-green-100 mb-6">
            Learn crypto at your own pace. From absolute beginner to advanced trader.
          </p>
          
          {/* Overall Progress */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Your Progress</span>
              <span className="font-bold">{completedLessons}/{totalLessons} lessons</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <p className="text-green-100 text-sm mt-2">
              {overallProgress === 0 
                ? "Let's start your crypto journey!" 
                : overallProgress < 50 
                ? "Great start! Keep learning!" 
                : overallProgress < 100 
                ? "You're doing amazing!" 
                : "🎉 You're a crypto expert!"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Course Grid */}
        {!selectedCourse ? (
          <>
            <h2 className="text-2xl font-bold mb-6">Choose a Course</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => setSelectedCourse(course.id)}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow text-left group"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{course.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                          {course.title}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          course.level === 'beginner' ? 'bg-green-100 text-green-700' :
                          course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {course.level}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{course.description}</p>
                      
                      <div className="mt-4">
                        <ProgressBar 
                          value={course.lessons.filter(l => l.completed).length} 
                          max={course.lessons.length}
                          label={`${course.lessons.length} lessons`}
                          color={course.progress > 0 ? 'green' : 'blue'}
                        />
                      </div>
                      
                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                        <span>📖 {course.lessons.length} lessons</span>
                        <span>⏱️ ~{course.lessons.reduce((sum, l) => sum + parseInt(l.duration), 0)} min</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Tips */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">💡 Quick Tips</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="text-2xl">🎯</span>
                  <h3 className="font-bold mt-2">Start with Basics</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Even if you know some crypto, the Basics course fills important gaps.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="text-2xl">⏰</span>
                  <h3 className="font-bold mt-2">Take Your Time</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    There&apos;s no rush. Understanding is more important than speed.
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="text-2xl">🔄</span>
                  <h3 className="font-bold mt-2">Practice Along</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Try our tools as you learn. Practice makes perfect!
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Course Detail View */
          <div>
            <button
              onClick={() => setSelectedCourse(null)}
              className="text-blue-600 hover:text-blue-800 mb-6 flex items-center gap-2"
            >
              ← Back to Courses
            </button>

            <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">{selectedCourseData?.emoji}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedCourseData?.title}</h2>
                  <p className="text-gray-600">{selectedCourseData?.description}</p>
                </div>
              </div>

              <ProgressBar 
                value={selectedCourseData?.lessons.filter(l => l.completed).length || 0} 
                max={selectedCourseData?.lessons.length || 1}
                label="Course Progress"
                color="green"
              />
            </div>

            {/* Lessons List */}
            <div className="space-y-3">
              {selectedCourseData?.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={`bg-white rounded-lg p-4 border ${
                    lesson.locked 
                      ? 'border-gray-200 opacity-60' 
                      : lesson.completed 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      lesson.completed 
                        ? 'bg-green-500 text-white' 
                        : lesson.locked 
                        ? 'bg-gray-200 text-gray-400' 
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {lesson.completed ? '✓' : lesson.locked ? '🔒' : index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm text-gray-500">{lesson.duration}</span>
                      {!lesson.locked && (
                        <button 
                          className={`block mt-1 px-4 py-1 rounded-lg text-sm font-medium ${
                            lesson.completed 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {lesson.completed ? 'Review' : 'Start'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Glossary Teaser */}
        <div className="mt-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">📖 Crypto Glossary</h2>
              <p className="text-purple-100">
                Confused by crypto jargon? Our glossary explains 100+ terms in simple English.
              </p>
            </div>
            <Link
              href="/glossary"
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-bold hover:bg-purple-50 transition-colors"
            >
              Open Glossary
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
