/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Circle, RefreshCw, CheckCircle2, XCircle, Info, HelpCircle } from 'lucide-react';

type Relationship = 'disjoint' | 'external_tangent' | 'intersecting' | 'internal_tangent' | 'contained' | 'concentric';

interface Question {
  r1: number;
  r2: number;
  d: number;
  correctRelationship: Relationship;
}

const RELATIONSHIP_MAP: Record<Relationship, { math: string; label: string }> = {
  disjoint: { math: 'd > R + r', label: '外離' },
  external_tangent: { math: 'd = R + r', label: '外切' },
  intersecting: { math: 'R - r < d < R + r', label: '相交' },
  internal_tangent: { math: 'd = R - r (且 d > 0)', label: '內切' },
  contained: { math: '0 < d < R - r', label: '內含' },
  concentric: { math: 'd = 0', label: '同心圓' },
};

export default function App() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [userMath, setUserMath] = useState<string>('');
  const [userState, setUserState] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateQuestion = () => {
    const r1 = Math.floor(Math.random() * 60) + 30; // 30-90
    const r2 = Math.floor(Math.random() * 60) + 30; // 30-90
    
    const R = Math.max(r1, r2);
    const r = Math.min(r1, r2);
    
    // Choose a relationship type to ensure variety
    const types: Relationship[] = ['disjoint', 'external_tangent', 'intersecting', 'internal_tangent', 'contained', 'concentric'];
    const selectedType = types[Math.floor(Math.random() * types.length)];
    
    let d = 0;
    switch (selectedType) {
      case 'disjoint':
        d = R + r + Math.floor(Math.random() * 40) + 10;
        break;
      case 'external_tangent':
        d = R + r;
        break;
      case 'intersecting':
        // R-r < d < R+r
        d = Math.floor(Math.random() * (R + r - (R - r) - 10)) + (R - r) + 5;
        break;
      case 'internal_tangent':
        d = R - r;
        if (d === 0) d = 0; // Will be concentric if R=r
        break;
      case 'contained':
        // 0 < d < R-r
        if (R === r) {
          d = 0; // Force concentric if radii are equal
        } else {
          d = Math.floor(Math.random() * (R - r - 5)) + 5;
        }
        break;
      case 'concentric':
        d = 0;
        break;
    }

    // Double check the relationship because random values might shift it
    let finalType: Relationship = 'disjoint';
    if (d === 0) finalType = 'concentric';
    else if (d === R + r) finalType = 'external_tangent';
    else if (d === R - r) finalType = 'internal_tangent';
    else if (d > R + r) finalType = 'disjoint';
    else if (d < R - r) finalType = 'contained';
    else finalType = 'intersecting';

    setQuestion({ r1, r2, d, correctRelationship: finalType });
    setUserMath('');
    setUserState('');
    setSubmitted(false);
    setIsCorrect(false);
  };

  useEffect(() => {
    generateQuestion();
  }, []);

  useEffect(() => {
    if (submitted && canvasRef.current && question) {
      drawCircles();
    }
  }, [submitted, question]);

  const drawCircles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Scale factor to fit canvas
    const maxDim = Math.max(question.r1 + question.r2 + question.d, 100);
    const scale = (Math.min(canvas.width, canvas.height) * 0.4) / (maxDim / 2);

    const r1Scaled = question.r1 * scale;
    const r2Scaled = question.r2 * scale;
    const dScaled = question.d * scale;

    // Draw Circle 1 (Green)
    ctx.beginPath();
    ctx.arc(centerX - dScaled / 2, centerY, r1Scaled, 0, Math.PI * 2);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.fill();

    // Draw Circle 2 (Red)
    ctx.beginPath();
    ctx.arc(centerX + dScaled / 2, centerY, r2Scaled, 0, Math.PI * 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
    ctx.fill();

    // Draw distance line
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX - dScaled / 2, centerY);
    ctx.lineTo(centerX + dScaled / 2, centerY);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw centers
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(centerX - dScaled / 2, centerY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + dScaled / 2, centerY, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const checkAnswer = () => {
    if (!question) return;
    const correct = userMath === question.correctRelationship && userState === question.correctRelationship;
    setIsCorrect(correct);
    setSubmitted(true);
  };

  if (!question) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-xl">
              <Circle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">兩圓位置關係挑戰</h1>
          </div>
          <button 
            onClick={generateQuestion}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            title="下一題"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Info Panel */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">圓 1 半徑 (R₁)</p>
            <p className="text-2xl font-mono font-bold text-emerald-600">{question.r1}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">圓 2 半徑 (R₂)</p>
            <p className="text-2xl font-mono font-bold text-red-600">{question.r2}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">圓心距 (d)</p>
            <p className="text-2xl font-mono font-bold text-slate-800">{question.d}</p>
          </div>
        </div>

        {/* Question Panel */}
        <div className="p-6 space-y-6">
          <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-2xl text-blue-800 text-sm">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p>💡 提示：設大圓半徑為 <span className="font-bold italic">R</span>，小圓半徑為 <span className="font-bold italic">r</span>。請根據給定的數值判斷它們的關係。</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                1. 圓心距與半徑的關係為：
              </label>
              <select 
                value={userMath}
                onChange={(e) => setUserMath(e.target.value)}
                disabled={submitted}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="" disabled>請選擇不等式/等式關係</option>
                {Object.entries(RELATIONSHIP_MAP).map(([key, val]) => (
                  <option key={key} value={key}>{val.math}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-slate-400" />
                2. 兩圓的位置關係為：
              </label>
              <select 
                value={userState}
                onChange={(e) => setUserState(e.target.value)}
                disabled={submitted}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all disabled:opacity-50 disabled:bg-slate-50"
              >
                <option value="" disabled>請選擇位置關係</option>
                {Object.entries(RELATIONSHIP_MAP).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>

          {!submitted ? (
            <button 
              onClick={checkAnswer}
              disabled={!userMath || !userState}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-200"
            >
              確認答案並繪圖
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-2xl border-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-center gap-3 mb-4">
                {isCorrect ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h2 className={`text-xl font-bold ${isCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                    {isCorrect ? '太棒了！完全正確' : '再試一次吧！'}
                  </h2>
                  {!isCorrect && (
                    <p className="text-sm text-red-700 mt-1">
                      正確答案：{RELATIONSHIP_MAP[question.correctRelationship].math} ({RELATIONSHIP_MAP[question.correctRelationship].label})
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-inner flex justify-center">
                <canvas 
                  ref={canvasRef} 
                  width={400} 
                  height={300}
                  className="max-w-full h-auto"
                />
              </div>

              <button 
                onClick={generateQuestion}
                className="w-full mt-6 bg-white border-2 border-slate-200 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                🎲 下一題
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>

      <footer className="mt-8 text-slate-400 text-sm flex items-center gap-4">
        <p>© 2026 數學互動學習系統</p>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <p>兩圓位置關係專題</p>
      </footer>
    </div>
  );
}
