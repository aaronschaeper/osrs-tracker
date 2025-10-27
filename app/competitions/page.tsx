"use client";

import React from 'react';
import Navigation from '@/components/Navigation';
import { Trophy, Calendar, Users, Swords, Target, Crown } from 'lucide-react';

export default function CompetitionsPage() {
  return (
    <div className="min-h-screen bg-[#1a1410] text-[#e6d5b8] stone-bg">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-12">
          <div className="inline-block mb-6 p-6 bg-gradient-to-br from-[#5a4a3a] to-[#4a3a2a] rounded-full border-4 border-[#d4a76a] shadow-2xl">
            <Trophy className="text-[#d4a76a]" size={64} />
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-[#d4a76a]" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>
            Competitions
          </h1>
          
          <p className="text-[#b8a890] text-lg mb-12 max-w-2xl mx-auto">
            Competition tracking coming soon! Create competitions from the Dashboard to challenge your group and see who reigns supreme.
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-8 rounded-lg border-2 border-[#4a3a2a] shadow-xl hover:shadow-2xl transition-all hover:border-[#5a4a3a]">
              <div className="inline-block p-4 bg-gradient-to-br from-[#3a5a5a] to-[#2a4a4a] rounded-lg mb-4 border-2 border-[#4a6a6a]">
                <Calendar className="text-[#9ad5d5]" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[#d4a76a]">Time-based</h3>
              <p className="text-[#b8a890] text-sm">
                Track progress over custom time periods. Set daily, weekly, or monthly competitions.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-8 rounded-lg border-2 border-[#4a3a2a] shadow-xl hover:shadow-2xl transition-all hover:border-[#5a4a3a]">
              <div className="inline-block p-4 bg-gradient-to-br from-[#5a4a3a] to-[#4a3a2a] rounded-lg mb-4 border-2 border-[#6a5a4a]">
                <Target className="text-[#d4a76a]" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[#d4a76a]">Skill Focused</h3>
              <p className="text-[#b8a890] text-sm">
                Compete in specific skills. See who can gain the most XP in Attack, Mining, or any other skill.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-8 rounded-lg border-2 border-[#4a3a2a] shadow-xl hover:shadow-2xl transition-all hover:border-[#5a4a3a]">
              <div className="inline-block p-4 bg-gradient-to-br from-[#3a5a3a] to-[#2a4a2a] rounded-lg mb-4 border-2 border-[#4a6a4a]">
                <Crown className="text-[#9ad59a]" size={32} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-[#d4a76a]">Leaderboards</h3>
              <p className="text-[#b8a890] text-sm">
                See who's gaining the most. Real-time rankings and historical competition results.
              </p>
            </div>
          </div>

          {/* Example Competition Types */}
          <div className="bg-gradient-to-br from-[#2a2420] to-[#1f1a16] p-8 rounded-lg border-2 border-[#4a3a2a] shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Swords className="text-[#d4a76a]" size={28} />
              <h2 className="text-2xl font-bold text-[#d4a76a]">Competition Ideas</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-[#1a1410] p-4 rounded border border-[#4a3a2a] hover:border-[#5a4a3a] transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#6ab86a] rounded-full"></div>
                  <h4 className="font-semibold text-[#e6d5b8]">Total XP Gained</h4>
                </div>
                <p className="text-[#b8a890] text-sm">Who can gain the most total XP in a week?</p>
              </div>

              <div className="bg-[#1a1410] p-4 rounded border border-[#4a3a2a] hover:border-[#5a4a3a] transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#d4a76a] rounded-full"></div>
                  <h4 className="font-semibold text-[#e6d5b8]">Level Race</h4>
                </div>
                <p className="text-[#b8a890] text-sm">First to reach a specific total level wins!</p>
              </div>

              <div className="bg-[#1a1410] p-4 rounded border border-[#4a3a2a] hover:border-[#5a4a3a] transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#9ad5d5] rounded-full"></div>
                  <h4 className="font-semibold text-[#e6d5b8]">Skill Showdown</h4>
                </div>
                <p className="text-[#b8a890] text-sm">Most XP gained in a specific skill</p>
              </div>

              <div className="bg-[#1a1410] p-4 rounded border border-[#4a3a2a] hover:border-[#5a4a3a] transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#c5a5c5] rounded-full"></div>
                  <h4 className="font-semibold text-[#e6d5b8]">Clue Scroll Hunter</h4>
                </div>
                <p className="text-[#b8a890] text-sm">Who can complete the most clue scrolls?</p>
              </div>

              <div className="bg-[#1a1410] p-4 rounded border border-[#4a3a2a] hover:border-[#5a4a3a] transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#b86a6a] rounded-full"></div>
                  <h4 className="font-semibold text-[#e6d5b8]">Boss Slayer</h4>
                </div>
                <p className="text-[#b8a890] text-sm">Track boss kills and compete for most defeated</p>
              </div>

              <div className="bg-[#1a1410] p-4 rounded border border-[#4a3a2a] hover:border-[#5a4a3a] transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#7a9ab8] rounded-full"></div>
                  <h4 className="font-semibold text-[#e6d5b8]">Achievement Race</h4>
                </div>
                <p className="text-[#b8a890] text-sm">First to complete a specific achievement diary</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-[#5a4a3a] via-[#4a3a2a] to-[#5a4a3a] p-8 rounded-lg border-2 border-[#d4a76a] shadow-2xl">
            <Users className="mx-auto mb-4 text-[#d4a76a]" size={48} />
            <h3 className="text-2xl font-bold mb-3 text-[#e6d5b8]">Ready to Compete?</h3>
            <p className="text-[#b8a890] mb-6 max-w-2xl mx-auto">
              Head back to the Dashboard and click "Create Competition" to start challenging your group ironman team!
            </p>
            <a 
              href="/"
              className="inline-block bg-gradient-to-br from-[#3a5f3a] to-[#2a4a2a] hover:from-[#4a7f4a] hover:to-[#3a5a3a] px-8 py-3 rounded-lg border-2 border-[#2a4a2a] hover:border-[#3a5a3a] font-semibold transition-all shadow-lg hover:shadow-xl text-[#e6d5b8]"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}