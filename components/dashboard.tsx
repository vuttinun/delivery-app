"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock, MapPin, User, LogOut, RefreshCw, Plus, Search, Gavel as Label } from "lucide-react"
import QueueDetail from "./queue-detail"
import CreateCustomJob from "./create-custom-job"

interface QueueItem {
  name: string
  requested_date: string
  requested_time: string
  requested_time_2?: string
  assign_to_name?: string
  sales_phone_number?: string
  customer: string
  address: string
  contact_person_name?: string
  phone_number?: string
  driver_or_messenger_name: string
  custom_list: string
  latitude?: string
  longitude?: string
  note_to_shipper?: string
  date_time?: string | null
}

interface DashboardProps {
  driverName: string
  onLogout: () => void
}

export default function Dashboard({ driverName, onLogout }: DashboardProps) {
  const [queues, setQueues] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedQueue, setSelectedQueue] = useState<QueueItem | null>(null)
  const [showCreateJob, setShowCreateJob] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showDayEndModal, setShowDayEndModal] = useState(false)
  const [endMileage, setEndMileage] = useState("")
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [startMileage, setStartMileage] = useState<number>(0)

  useEffect(() => {
    const loginData = localStorage.getItem("deliveryLogin")
    if (loginData) {
      const parsed = JSON.parse(loginData)
      setStartMileage(parsed.startMileage || 0)
      console.log("[v0] Retrieved start mileage:", parsed.startMileage)
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("[v0] Geolocation denied or failed:", error)
          setCurrentLocation({ lat: 0, lng: 0 }) // Use "-" equivalent
        },
      )
    }
    fetchQueues()
  }, [])

  const fetchQueues = async () => {
    try {
      setLoading(true)
      console.log("[v0] Starting API call to fetch queues")
      const response = await fetch("https://gto.vuttinun.space/webhook/queuerequest")
      console.log("[v0] API response status:", response.status)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Raw API data:", data)

      let queueData = []

      if (Array.isArray(data)) {
        if (data.length > 0 && data[0].data && Array.isArray(data[0].data)) {
          queueData = data[0].data
        } else {
          queueData = data
        }
      } else if (data && typeof data === "object") {
        if (data.data && Array.isArray(data.data)) {
          queueData = data.data
        } else if (data.queues && Array.isArray(data.queues)) {
          queueData = data.queues
        } else if (data.items && Array.isArray(data.items)) {
          queueData = data.items
        } else {
          queueData = [data]
        }
      }

      console.log("[v0] Processed queue data:", queueData)
      console.log("[v0] Queue data length:", queueData?.length)

      if (Array.isArray(queueData)) {
        setQueues(queueData)
      } else {
        console.error("[v0] Data is not an array:", queueData)
        setQueues([])
      }
    } catch (error) {
      console.error("[v0] Error fetching queues:", error)
      setQueues([])
    } finally {
      setLoading(false)
    }
  }

  const handleDayEnd = () => {
    setShowDayEndModal(true)
  }

  const handleDayEndComplete = () => {
    if (!endMileage.trim()) {
      alert("กรุณากรอกเลขไมล์สิ้นสุดวัน")
      return
    }

    const endMileageValue = Number.parseFloat(endMileage)
    if (endMileageValue < 0) {
      alert("เลขไมล์ต้องไม่ติดลบ")
      return
    }

    const totalDistance = endMileageValue - startMileage

    if (totalDistance < 0) {
      alert("เลขไมล์สิ้นสุดต้องมากกว่าเลขไมล์เริ่มต้น")
      return
    }

    const endDayData = {
      endMileage: endMileage,
      endTime: new Date().toISOString(),
      totalDistance: totalDistance,
      location: currentLocation || { lat: "-", lng: "-" },
    }
    localStorage.setItem("endDayData", JSON.stringify(endDayData))

    alert(`ปิดงานเรียบร้อย!\nระยะทางที่วิ่งวันนี้: ${totalDistance.toFixed(1)} กิโลเมตร`)
    onLogout()
  }

  const isNearDeadline = (queue: QueueItem) => {
    const now = new Date()
    const requestedDateTime = new Date(`${queue.requested_date} ${queue.requested_time_2 || queue.requested_time}`)
    const timeDiff = requestedDateTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    return minutesDiff <= 30 && minutesDiff > 0
  }

  const isOverdue = (queue: QueueItem) => {
    const now = new Date()
    const deadlineTime = queue.requested_time_2 || queue.requested_time
    const requestedDateTime = new Date(`${queue.requested_date} ${deadlineTime}`)
    return now > requestedDateTime
  }

  const isCompleted = (queue: QueueItem) => {
    return queue.date_time && queue.date_time !== null
  }

  const driverQueues = queues
    .filter((queue) => queue.driver_or_messenger_name === driverName)
    .filter(
      (queue) =>
        searchTerm === "" ||
        queue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        queue.customer.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      const aCompleted = isCompleted(a)
      const bCompleted = isCompleted(b)

      if (aCompleted && !bCompleted) return 1
      if (!aCompleted && bCompleted) return -1

      if (!aCompleted && !bCompleted) {
        const aTime = new Date(`${a.requested_date} ${a.requested_time}`)
        const bTime = new Date(`${b.requested_date} ${b.requested_time}`)
        return aTime.getTime() - bTime.getTime()
      }

      return 0
    })

  if (selectedQueue) {
    return <QueueDetail queue={selectedQueue} onBack={() => setSelectedQueue(null)} driverName={driverName} />
  }

  if (showCreateJob) {
    return <CreateCustomJob onBack={() => setShowCreateJob(false)} driverName={driverName} />
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">สวัสดี {driverName}</h1>
            <p className="text-sm opacity-90">วันที่ {new Date().toLocaleDateString("th-TH")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCreateJob(true)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDayEnd}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">คิวงานของคุณ ({driverQueues.length})</h2>
          <Button variant="outline" size="sm" onClick={fetchQueues} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาด้วยเลขคิวหรือชื่อลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        ) : driverQueues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">{searchTerm ? "ไม่พบคิวงานที่ค้นหา" : "ไม่มีคิวงานสำหรับคุณในขณะนี้"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {driverQueues.map((queue, index) => {
              const completed = isCompleted(queue)
              const nearDeadline = isNearDeadline(queue)
              const overdue = isOverdue(queue)

              return (
                <Card
                  key={index}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    completed
                      ? "bg-green-50 border-green-200"
                      : overdue
                        ? "bg-orange-50 border-orange-200"
                        : nearDeadline
                          ? "bg-yellow-50 border-yellow-200"
                          : ""
                  }`}
                  onClick={() => setSelectedQueue(queue)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{queue.name}</CardTitle>
                      <div className="flex gap-2">
                        {completed && (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            เสร็จแล้ว
                          </Badge>
                        )}
                        {!completed && overdue && (
                          <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700">
                            เลยกำหนด
                          </Badge>
                        )}
                        {!completed && !overdue && nearDeadline && (
                          <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">
                            ใกล้เลยกำหนด
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{queue.custom_list}</Badge>
                    </div>
                    <CardDescription className="text-sm">{queue.customer}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {queue.requested_date} {queue.requested_time}
                          {queue.requested_time_2 && ` - ${queue.requested_time_2}`}
                        </span>
                      </div>
                      {completed && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">
                            เสร็จเมื่อ: {new Date(queue.date_time!).toLocaleString("th-TH")}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-pretty">{queue.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{queue.driver_or_messenger_name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <Button
            onClick={() => setShowCreateJob(true)}
            size="lg"
            className="rounded-full shadow-lg"
            variant="secondary"
          >
            <Plus className="h-5 w-5 mr-2" />
            สร้างงาน
          </Button>
          <Button onClick={handleDayEnd} size="lg" className="rounded-full shadow-lg">
            ปิดงาน
          </Button>
        </div>

        {showDayEndModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>ปิดงานประจำวัน</CardTitle>
                <CardDescription>กรอกเลขไมล์สิ้นสุดวันเพื่อคำนวณระยะทาง</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endMileage">เลขไมล์สิ้นสุดวัน</Label>
                  <Input
                    id="endMileage"
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="กรอกเลขไมล์"
                    value={endMileage}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || (/^\d*\.?\d*$/.test(value) && Number.parseFloat(value) >= 0)) {
                        setEndMileage(value)
                      }
                    }}
                    className="text-lg h-12 px-4 py-3"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>เลขไมล์เริ่มต้น: {startMileage} กม.</p>
                  {endMileage && <p>ระยะทางที่วิ่ง: {(Number.parseFloat(endMileage) - startMileage).toFixed(1)} กม.</p>}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDayEndModal(false)} className="flex-1">
                    ยกเลิก
                  </Button>
                  <Button onClick={handleDayEndComplete} className="flex-1">
                    ปิดงาน
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
