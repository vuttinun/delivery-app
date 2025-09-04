"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Truck, CheckCircle, AlertCircle, LogOut } from "lucide-react"

interface CompletedJob {
  queueName: string
  completedBy: string
  completedAt: string
  endMileage: number
  images: string[]
}

interface DayEndSummaryProps {
  driverName: string
  onBack: () => void
  onLogout: () => void
}

export default function DayEndSummary({ driverName, onBack, onLogout }: DayEndSummaryProps) {
  const [completedJobs, setCompletedJobs] = useState<CompletedJob[]>([])
  const [startMileage, setStartMileage] = useState(0)
  const [endMileage, setEndMileage] = useState("")
  const [totalDistance, setTotalDistance] = useState(0)

  useEffect(() => {
    // Get login data for start mileage
    const loginData = localStorage.getItem("deliveryLogin")
    if (loginData) {
      const parsed = JSON.parse(loginData)
      setStartMileage(parsed.startMileage || 0)
    }

    // Get completed jobs
    const jobs = JSON.parse(localStorage.getItem("completedJobs") || "[]")
    const today = new Date().toISOString().split("T")[0]
    const todayJobs = jobs.filter((job: CompletedJob) => {
      const jobDate = new Date(job.completedAt).toISOString().split("T")[0]
      return jobDate === today && job.completedBy === driverName
    })
    setCompletedJobs(todayJobs)
  }, [driverName])

  useEffect(() => {
    if (endMileage) {
      const distance = Number.parseFloat(endMileage) - startMileage
      setTotalDistance(distance > 0 ? distance : 0)
    }
  }, [endMileage, startMileage])

  const handleEndDay = () => {
    if (!endMileage.trim()) {
      alert("กรุณากรอกเลขไมล์สิ้นสุดวัน")
      return
    }

    if (Number.parseFloat(endMileage) < startMileage) {
      alert("เลขไมล์สิ้นสุดต้องมากกว่าเลขไมล์เริ่มต้น")
      return
    }

    // Save day end summary
    const dayEndData = {
      driverName,
      date: new Date().toISOString().split("T")[0],
      startMileage,
      endMileage: Number.parseFloat(endMileage),
      totalDistance,
      completedJobs: completedJobs.length,
      endTime: new Date().toISOString(),
    }

    // Get existing day summaries
    const existingSummaries = JSON.parse(localStorage.getItem("daySummaries") || "[]")
    existingSummaries.push(dayEndData)
    localStorage.setItem("daySummaries", JSON.stringify(existingSummaries))

    alert(`ปิดวันเรียบร้อยแล้ว!\nระยะทางรวม: ${totalDistance.toFixed(1)} กม.\nงานที่เสร็จสิ้น: ${completedJobs.length} งาน`)
    onLogout()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-secondary text-secondary-foreground p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-secondary-foreground hover:bg-secondary-foreground/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">สรุปงานประจำวัน</h1>
            <p className="text-sm opacity-90">วันที่ {new Date().toLocaleDateString("th-TH")}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mileage Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              สรุประยะทาง
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">ไมล์เริ่มต้น</Label>
                <p className="text-lg font-semibold">{startMileage.toFixed(1)} กม.</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">ไมล์สิ้นสุด</Label>
                <Input
                  type="number"
                  placeholder="กรอกเลขไมล์สิ้นสุด"
                  value={endMileage}
                  onChange={(e) => setEndMileage(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {totalDistance > 0 && (
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ระยะทางรวมวันนี้</span>
                  <span className="text-xl font-bold text-primary">{totalDistance.toFixed(1)} กม.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Jobs Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              สรุปงานที่เสร็จสิ้น
            </CardTitle>
            <CardDescription>งานที่ทำเสร็จในวันนี้ทั้งหมด {completedJobs.length} งาน</CardDescription>
          </CardHeader>
          <CardContent>
            {completedJobs.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">ยังไม่มีงานที่เสร็จสิ้น</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((job, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{job.queueName}</p>
                      <p className="text-sm text-muted-foreground">
                        เสร็จสิ้นเวลา{" "}
                        {new Date(job.completedAt).toLocaleTimeString("th-TH", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      เสร็จสิ้น
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              เวลาทำงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">เริ่มงาน:</span>
                <span>
                  {(() => {
                    const loginData = localStorage.getItem("deliveryLogin")
                    if (loginData) {
                      const parsed = JSON.parse(loginData)
                      return new Date(parsed.loginTime).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                    return "-"
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">เวลาปัจจุบัน:</span>
                <span>
                  {new Date().toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* End Day Button */}
        <div className="space-y-3">
          <Button onClick={handleEndDay} className="w-full" size="lg" disabled={!endMileage.trim()}>
            <LogOut className="mr-2 h-4 w-4" />
            ปิดวันและออกจากระบบ
          </Button>

          <Button variant="outline" onClick={onBack} className="w-full bg-transparent">
            กลับไปดูคิวงาน
          </Button>
        </div>
      </div>
    </div>
  )
}
