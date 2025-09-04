"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Building, FileText, Camera, Upload, CheckCircle } from "lucide-react"

interface CreateCustomJobProps {
  onBack: () => void
  driverName: string
}

export default function CreateCustomJob({ onBack, driverName }: CreateCustomJobProps) {
  const [formData, setFormData] = useState({
    customer: "",
    address: "",
    note_to_shipper: "",
    latitude: "",
    longitude: "",
  })
  const [uploadedImages, setUploadedImages] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdQueue, setCreatedQueue] = useState<any>(null)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          if (!formData.latitude && !formData.longitude) {
            setFormData((prev) => ({
              ...prev,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            }))
          }
        },
        (error) => {
          console.log("[v0] Geolocation failed:", error)
          setCurrentLocation({ lat: 0, lng: 0 })
        },
      )
    }
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      setUploadedImages(Array.from(files))
    }
  }

  const handleSubmit = async () => {
    if (!formData.customer.trim() || !formData.address.trim()) {
      alert("กรุณากรอกชื่อสถานที่และที่อยู่")
      return
    }

    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("customer", formData.customer)
      formDataToSend.append("address", formData.address)
      formDataToSend.append("note_to_shipper", formData.note_to_shipper || "")
      formDataToSend.append("latitude", formData.latitude || currentLocation?.lat?.toString() || "-")
      formDataToSend.append("longitude", formData.longitude || currentLocation?.lng?.toString() || "-")
      formDataToSend.append("driver_or_messenger_name", driverName)
      formDataToSend.append("requested_date", new Date().toISOString().split("T")[0])
      formDataToSend.append("requested_time", "09:00:00")

      uploadedImages.forEach((file) => {
        formDataToSend.append("photos", file)
      })

      const response = await fetch("/api/create-queue", {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "ไม่สามารถสร้างคิวใหม่ได้")
      }

      const result = await response.json()
      setCreatedQueue(result)
      setShowSuccess(true)
    } catch (error) {
      console.error("Error creating queue:", error)
      alert(`เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : "ไม่สามารถสร้างคิวใหม่ได้"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground p-4">
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
              <h1 className="text-lg font-bold">สร้างงานแทรกสำเร็จ</h1>
              <p className="text-sm opacity-90">งานใหม่ถูกสร้างเรียบร้อยแล้ว</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-800">สร้างคิวใหม่สำเร็จ!</CardTitle>
              <CardDescription className="text-green-700">
                คิวงาน {createdQueue?.name || "ใหม่"} ถูกสร้างและส่งไปยังระบบแล้ว
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-medium mb-2">รายละเอียดงาน:</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    <strong>ลูกค้า:</strong> {formData.customer}
                  </div>
                  <div>
                    <strong>ที่อยู่:</strong> {formData.address}
                  </div>
                  <div>
                    <strong>คนขับ:</strong> {driverName}
                  </div>
                  {formData.note_to_shipper && (
                    <div>
                      <strong>หมายเหตุ:</strong> {formData.note_to_shipper}
                    </div>
                  )}
                  {uploadedImages.length > 0 && (
                    <div>
                      <strong>รูปภาพ:</strong> {uploadedImages.length} ไฟล์
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={onBack} className="w-full" size="lg">
                กลับไปหน้าหลัก
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
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
            <h1 className="text-lg font-bold">สร้างงานแทรก</h1>
            <p className="text-sm opacity-90">เพิ่มงานใหม่ที่ต้องทำ</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building className="h-5 w-5" />
              ข้อมูลพื้นฐาน
            </CardTitle>
            <CardDescription>กรอกรายละเอียดสถานที่และงานที่ต้องทำ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer">ชื่อสถานที่ / บริษัท</Label>
              <Input
                id="customer"
                placeholder="เช่น บริษัท ABC จำกัด"
                value={formData.customer}
                onChange={(e) => handleInputChange("customer", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">ที่อยู่</Label>
              <Textarea
                id="address"
                placeholder="กรอกที่อยู่ที่ต้องไป"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">ละติจูด (ไม่บังคับ)</Label>
                <Input
                  id="latitude"
                  placeholder="13.7563"
                  value={formData.latitude}
                  onChange={(e) => handleInputChange("latitude", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">ลองจิจูด (ไม่บังคับ)</Label>
                <Input
                  id="longitude"
                  placeholder="100.5018"
                  value={formData.longitude}
                  onChange={(e) => handleInputChange("longitude", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5" />
              อัปโหลดรูปภาพ
            </CardTitle>
            <CardDescription>ถ่ายรูปหรือแนบไฟล์ที่เกี่ยวข้อง (ไม่บังคับ)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="imageUpload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
                  </div>
                </Label>
                <Input
                  id="imageUpload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {uploadedImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">ไฟล์ที่เลือก: {uploadedImages.length} ไฟล์</p>
                  <div className="space-y-1">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              หมายเหตุสำหรับคนส่ง
            </CardTitle>
            <CardDescription>รายละเอียดเพิ่มเติมหรือข้อมูลสำคัญ (ไม่บังคับ)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="เช่น ติดต่อคุณสมชาย โทร 081-234-5678, ส่งของชั้น 5"
              value={formData.note_to_shipper}
              onChange={(e) => handleInputChange("note_to_shipper", e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="pt-4">
          <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "กำลังสร้างคิว..." : "สร้างงานแทรก"}
          </Button>
        </div>
      </div>
    </div>
  )
}
