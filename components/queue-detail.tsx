"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Clock, MapPin, User, Camera, Upload, Phone, Navigation, X } from "lucide-react"

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
}

interface QueueDetailProps {
  queue: QueueItem
  onBack: () => void
  driverName: string
}

export default function QueueDetail({ queue, onBack, driverName }: QueueDetailProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [deliveryComment, setDeliveryComment] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  useEffect(() => {
    const existingImages = JSON.parse(localStorage.getItem(`queue-${queue.name}-images`) || "[]")
    setUploadedImages(existingImages)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("[v0] Geolocation failed:", error)
          setCurrentLocation({ lat: 0, lng: 0 })
        },
      )
    }
  }, [queue.name])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append("photos", file)
      })
      formData.append("completed_time", new Date().toISOString())
      formData.append("device", navigator.userAgent)

      const response = await fetch(`/api/queue/${queue.name}/upload`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const result = await response.json()

      const newImages = result.queue.photos || []
      setUploadedImages(newImages)
      localStorage.setItem(`queue-${queue.name}-images`, JSON.stringify(newImages))
    } catch (error) {
      console.error("Error uploading images:", error)
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ")
    } finally {
      setIsUploading(false)
      event.target.value = ""
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index)
    setUploadedImages(newImages)
    localStorage.setItem(`queue-${queue.name}-images`, JSON.stringify(newImages))
  }

  const handleCallCustomer = () => {
    if (queue.phone_number) {
      window.location.href = `tel:${queue.phone_number}`
    }
  }

  const handleCallSales = () => {
    if (queue.sales_phone_number) {
      window.location.href = `tel:${queue.sales_phone_number}`
    }
  }

  const handleOpenMaps = () => {
    if (queue.latitude && queue.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${queue.latitude},${queue.longitude}`
      window.open(url, "_blank")
    } else if (queue.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queue.address)}`
      window.open(url, "_blank")
    }
  }

  const isOverdue = () => {
    const now = new Date()
    const deadlineTime = queue.requested_time_2 || queue.requested_time
    const requestedDateTime = new Date(`${queue.requested_date} ${deadlineTime}`)
    return now > requestedDateTime
  }

  const handleCompleteJob = async () => {
    setShowConfirmation(false)

    try {
      const completionData = {
        queueName: queue.name,
        completedBy: driverName,
        completedAt: new Date().toISOString(),
        images: uploadedImages,
        latitude: currentLocation?.lat?.toString() || "-",
        longitude: currentLocation?.lng?.toString() || "-",
        deliveryComment: deliveryComment.trim() || null,
      }

      const response = await fetch(`/api/queue/${queue.name}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(completionData),
      })

      if (response.ok) {
        const existingJobs = JSON.parse(localStorage.getItem("completedJobs") || "[]")
        existingJobs.push(completionData)
        localStorage.setItem("completedJobs", JSON.stringify(existingJobs))

        setShowSuccessPopup(true)
      } else {
        throw new Error("Failed to complete job")
      }
    } catch (error) {
      console.error("Error completing job:", error)
      const completionData = {
        queueName: queue.name,
        completedBy: driverName,
        completedAt: new Date().toISOString(),
        images: uploadedImages,
        latitude: currentLocation?.lat?.toString() || "-",
        longitude: currentLocation?.lng?.toString() || "-",
        deliveryComment: deliveryComment.trim() || null,
      }

      const existingJobs = JSON.parse(localStorage.getItem("completedJobs") || "[]")
      existingJobs.push(completionData)
      localStorage.setItem("completedJobs", JSON.stringify(existingJobs))

      setShowSuccessPopup(true)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground p-4 shadow-md">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{queue.name}</h1>
            <p className="text-sm opacity-90">{queue.customer}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{queue.customer}</CardTitle>
              {isOverdue() && (
                <Badge variant="destructive" className="bg-orange-600 hover:bg-orange-700">
                  เลยกำหนด
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Badge variant="secondary">{queue.custom_list}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="text-sm">
                  <div>{queue.requested_date}</div>
                  <div className="text-muted-foreground">
                    {queue.requested_time}
                    {queue.requested_time_2 && ` - ${queue.requested_time_2}`}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-sm text-pretty">{queue.address}</span>
              </div>

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="text-sm">
                  <div>คนขับ: {queue.driver_or_messenger_name}</div>
                  {queue.assign_to_name && (
                    <div className="text-muted-foreground">มอบหมายให้: {queue.assign_to_name}</div>
                  )}
                </div>
              </div>

              {queue.contact_person_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">ผู้ติดต่อ: {queue.contact_person_name}</span>
                </div>
              )}

              {queue.sales_phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm">เซลล์: {queue.sales_phone_number}</span>
                </div>
              )}

              {queue.note_to_shipper && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-1">หมายเหตุสำหรับคนส่ง:</p>
                  <p className="text-sm text-muted-foreground">{queue.note_to_shipper}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {queue.phone_number && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCallCustomer}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-xs">โทรลูกค้า</span>
                </Button>
              )}

              {queue.sales_phone_number && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCallSales}
                  className="flex items-center gap-1 bg-transparent"
                >
                  <Phone className="h-4 w-4" />
                  <span className="text-xs">โทรเซลล์</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenMaps}
                className="flex items-center gap-1 bg-transparent"
              >
                <Navigation className="h-4 w-4" />
                <span className="text-xs">เปิดแผนที่</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5" />
              อัปโหลดรูปภาพ
              {uploadedImages.length > 0 && <Badge variant="secondary">{uploadedImages.length} รูป</Badge>}
            </CardTitle>
            <CardDescription>ถ่ายรูปหลักฐานการส่งของหรือเอกสารที่เกี่ยวข้อง</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUpload" className="cursor-pointer">
                  <div
                    className={`border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors ${isUploading ? "opacity-50" : ""}`}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {isUploading ? "กำลังอัปโหลด..." : "คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง"}
                    </p>
                  </div>
                </Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image || "/placeholder.svg"}
                        alt={`อัปโหลดรูปที่ ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">หมายเหตุการจัดส่ง</CardTitle>
            <CardDescription>เพิ่มหมายเหตุหรือข้อมูลเพิ่มเติมสำหรับคิวนี้ (ไม่บังคับ)</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              placeholder="เช่น ลูกค้าไม่อยู่ ฝากไว้กับรปภ., ส่งเรียบร้อยแล้ว..."
              value={deliveryComment}
              onChange={(e) => setDeliveryComment(e.target.value)}
              className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
        <Button onClick={() => setShowConfirmation(true)} className="w-full" size="lg">
          เสร็จสิ้นงานนี้
        </Button>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>ยืนยันการปิดงาน</CardTitle>
              <CardDescription>คุณแน่ใจหรือไม่ว่าต้องการปิดงาน "{queue.name}" นี้?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowConfirmation(false)} className="flex-1">
                  ยกเลิก
                </Button>
                <Button onClick={handleCompleteJob} className="flex-1">
                  ยืนยัน
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-green-600">เสร็จสิ้น!</CardTitle>
              <CardDescription>งาน "{queue.name}" ได้ถูกบันทึกเรียบร้อยแล้ว</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setShowSuccessPopup(false)
                  onBack()
                }}
                className="w-full"
              >
                ตกลง
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
