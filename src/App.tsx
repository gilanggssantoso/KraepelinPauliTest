import React, { useState, useEffect, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { Activity, Clock, Play, RefreshCcw } from "lucide-react"

const DURATIONS = [3, 5, 10, 15, 20, 30]

export default function App() {
  const [testDuration, setTestDuration] = useState(10)
  const [status, setStatus] = useState<"idle" | "running" | "completed">("idle")
  const [timeLeft, setTimeLeft] = useState(10 * 60)

  // Ref for time left to ensure the keyboard handler uses the latest value without remounting
  const timeLeftRef = useRef(timeLeft)
  useEffect(() => {
    timeLeftRef.current = timeLeft
  }, [timeLeft])

  // Track correct answers per minute interval.
  const [scores, setScores] = useState<number[]>([])

  // Current pair of numbers to add
  const [num1, setNum1] = useState(0)
  const [num2, setNum2] = useState(0)

  const generateNumbers = () => {
    setNum1(Math.floor(Math.random() * 9) + 1) // 1-9
    setNum2(Math.floor(Math.random() * 9) + 1)
  }

  const startGame = () => {
    setStatus("running")
    setTimeLeft(testDuration * 60)
    setScores(Array(testDuration).fill(0))
    generateNumbers()
  }

  // Timer effect
  useEffect(() => {
    let timer: number
    if (status === "running") {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Finish test
            setStatus("completed")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [status])

  // Handle physical keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "running") return

      const numVal = parseInt(e.key, 10)
      if (!isNaN(numVal) && numVal >= 0 && numVal <= 9) {
        handleNumberSubmit(numVal)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [status, num1, num2])

  const handleNumberSubmit = (numVal: number) => {
    const correctSum = (num1 + num2) % 10

    if (numVal === correctSum) {
      // Correct!
      setScores((prev) => {
        const newScores = [...prev]
        // Calculate which minute we are currently in (0, 1, 2)
        // e.g. timeLeft = 180..121 -> index 0
        // timeLeft = 120..61 -> index 1
        // timeLeft = 60..1 -> index 2
        const minuteIndex =
          testDuration - 1 - Math.floor((timeLeftRef.current - 1) / 60)

        if (minuteIndex >= 0 && minuteIndex < testDuration) {
          newScores[minuteIndex] += 1
        }
        return newScores
      })
    }

    // Unlimited instances: always generate new numbers immediately
    generateNumbers()
  }

  const chartData = scores.map((score, index) => ({
    name: `Menit ${index + 1}`,
    score,
  }))

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900 font-sans flex flex-col">
      <header className="w-full max-w-3xl mx-auto p-6 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-semibold tracking-tight">
            Tes Kraepelin-Pauli
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto p-6 flex flex-col items-center justify-center">
        {status === "idle" && (
          <div className="text-center max-w-md space-y-6">
            <p className="text-slate-600 leading-relaxed">
              Tes ini berlangsung selama {testDuration} menit tanpa henti. Selesaikan
              penjumlahan sederhana sebanyak mungkin.
            </p>
            <div className="bg-slate-100 p-4 rounded-xl text-left text-sm space-y-3">
              <p>
                <strong>Instruksi:</strong> Jumlahkan kedua angka yang
                ditampilkan. Masukkan <strong>hanya digit terakhir</strong> dari
                hasil penjumlahan.
              </p>
              <p className="text-slate-500">
                Contoh: Jika Anda melihat 8 dan 7, jumlahnya adalah 15. Anda
                harus memasukkan angka <strong>5</strong>.
              </p>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">Pilih Durasi Tes</label>
              <div className="flex flex-wrap justify-center gap-3">
                {DURATIONS.map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setTestDuration(duration)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      testDuration === duration
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {duration} Menit
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startGame}
              className="inline-flex items-center justify-center space-x-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Mulai Tes</span>
            </button>
          </div>
        )}

        {status === "running" && (
          <div className="w-full flex flex-col items-center space-y-12">
            <div className="w-full flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                  Jawaban Benar (Menit ini)
                </p>
                <p className="text-2xl font-semibold text-indigo-600">
                  {scores[
                    testDuration -
                      1 -
                      Math.floor((Math.max(1, timeLeft) - 1) / 60)
                  ] ?? 0}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center justify-end space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Sisa Waktu</span>
                </p>
                <p
                  className={`text-3xl font-bold font-mono ${
                    timeLeft <= 10 ? "text-red-500" : "text-slate-900"
                  }`}
                >
                  {formatTime(timeLeft)}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-8">
              <div className="text-7xl font-bold font-mono space-y-2 text-center bg-white p-12 rounded-3xl shadow-sm border border-slate-200 min-w-[240px]">
                <div>{num1}</div>
                <div className="text-slate-300 border-b-4 border-slate-100 pb-2">
                  + {num2}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
                {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleNumberSubmit(num)}
                    className="h-16 text-2xl font-semibold bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors shadow-sm active:scale-95 flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <div className="col-start-2">
                  <button
                    onClick={() => handleNumberSubmit(0)}
                    className="w-full h-16 text-2xl font-semibold bg-white border border-slate-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-colors shadow-sm active:scale-95 flex items-center justify-center"
                  >
                    0
                  </button>
                </div>
              </div>
              <p className="text-slate-400 text-sm font-medium">
                Gunakan keypad atau keyboard Anda
              </p>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">Tes Selesai</h2>
              <p className="text-slate-600">
                Berikut adalah stabilitas performa Anda selama {testDuration} menit.
              </p>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow:
                        "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    activeDot={{ r: 6, fill: "#4f46e5" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center">
              <button
                onClick={startGame}
                className="inline-flex items-center justify-center space-x-2 bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-full font-medium hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Mulai Ulang Tes</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
