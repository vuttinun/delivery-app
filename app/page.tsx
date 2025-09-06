"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck, LogIn, Clock } from "lucide-react"
import Dashboard from "@/components/dashboard"

const DRIVERS = ["อรุณรัตน์", "นิทัศน์", "มัณฑนา", "ธัญญา มีน", "สมชาย", "วิชัย", "ประยุทธ", "สุรชัย"]

export default function DeliveryApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [driverName, setDriverName] = useState("")
  const [startMileage, setStartMileage] = useState("")
  const [currentDate, setCurrentDate] = useState("")

  useEffect(() => {
    // Check if already logged in today
    const loginData = localStorage.getItem("deliveryLogin")
    const today = new Date().toISOString().split("T")[0]

    if (loginData) {
      const parsed = JSON.parse(loginData)
      if (parsed.date === today) {
        setIsLoggedIn(true)
        setDriverName(parsed.driverName)
      }
    }

    setCurrentDate(today)
  }, [])

  const handleMileageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Only allow positive numbers
    if (value === "" || (/^\d*\.?\d*$/.test(value) && Number.parseFloat(value) >= 0)) {
      setStartMileage(value)
    }
  }

  const handleLogin = () => {
    if (!driverName.trim() || !startMileage.trim()) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน")
      return
    }

    const mileageValue = Number.parseFloat(startMileage)
    if (mileageValue < 0) {
      alert("เลขไมล์ต้องไม่ติดลบ")
      return
    }

    const loginData = {
      driverName: driverName.trim(),
      startMileage: mileageValue,
      date: currentDate,
      loginTime: new Date().toISOString(),
    }

    localStorage.setItem("deliveryLogin", JSON.stringify(loginData))
    setIsLoggedIn(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("deliveryLogin")
    setIsLoggedIn(false)
    setDriverName("")
    setStartMileage("")
  }

  if (isLoggedIn) {
    return <Dashboard driverName={driverName} onLogout={handleLogout} />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-balance mobile-xl">ระบบจัดการการส่งของ</CardTitle>
          <CardDescription className="text-pretty mobile-large">เข้าสู่ระบบเพื่อเริ่มงานประจำวัน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            <span>วันที่: {new Date().toLocaleDateString("th-TH")}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driverName" className="mobile-large">
              เลือกคนขับ
            </Label>
            <Select value={driverName} onValueChange={setDriverName}>
              <SelectTrigger className="text-lg h-12 px-4 py-3">
                <SelectValue placeholder="เลือกชื่อคนขับ" />
              </SelectTrigger>
              <SelectContent>
                {DRIVERS.map((driver) => (
                  <SelectItem key={driver} value={driver} className="mobile-large">
                    {driver}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startMileage" className="mobile-large">
              เลขไมล์เริ่มต้น (กม.)
            </Label>
            <Input
              id="startMileage"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="กรอกเลขไมล์เริ่มต้น"
              value={startMileage}
              onChange={handleMileageChange}
              className="text-lg h-12 px-4 py-3"
              min="0"
              step="0.1"
            />
          </div>

          <Button onClick={handleLogin} className="w-full text-lg h-12 px-4 py-3" size="lg">
            <LogIn className="mr-2 h-4 w-4" />
            เริ่มงานวันนี้
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
