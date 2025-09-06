// app/api/queue/[id]/route.ts (หรือไฟล์ route เดิมของคุณ)
import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs/promises"

// บังคับให้รันบน Node runtime (ไม่ใช่ Edge)
export const runtime = "nodejs"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("photos") as File[]
    const completedTime = formData.get("completed_time") as string
    const device = (formData.get("device") as string) || "Unknown"
    const location = (formData.get("location") as string) || null

    // เก็บไฟล์ใน public/uploads เพื่อเสิร์ฟเป็นสาธารณะได้
    const uploadDir = path.join(process.cwd(), "public", "uploads")
    await fs.mkdir(uploadDir, { recursive: true })

    const imageUrls: string[] = []
    for (const file of files) {
      if (!(file instanceof File)) continue

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const randomString = Math.random().toString(36).substring(2, 8)
      const fileExtension = (file.name.split(".").pop() || "jpg").toLowerCase()
      const filename = `${params.id}-${timestamp}-${randomString}.${fileExtension}`

      // แปลงไฟล์จาก Web File -> Buffer แล้วเขียนลงดิสก์
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filePath = path.join(uploadDir, filename)
      await fs.writeFile(filePath, buffer)

      // สร้าง URL จาก origin ปัจจุบัน
      const origin = new URL(request.url).origin
      imageUrls.push(`${origin}/uploads/${filename}`)
    }

    // รวมรูปทั้งหมดของ queue นี้ด้วยการสแกนโฟลเดอร์ (แทน localStorage ฝั่งเซิร์ฟเวอร์)
    // จะดึงไฟล์ที่มี prefix เป็น {id}-
    const allFiles = await fs.readdir(uploadDir)
    const allImages = allFiles
      .filter((name) => name.startsWith(`${params.id}-`))
      .map((name) => `${new URL(request.url).origin}/uploads/${name}`)
      // จัดเรียงใหม่ให้ล่าสุดอยู่ท้าย (ตามชื่อไฟล์ที่มี timestamp)
      .sort()

    // ยิง webhook เหมือนเดิม
    const webhookData = {
      doctype: "Queue Request",
      docname: params.id,
      imageUrls: imageUrls, // เฉพาะที่เพิ่งอัปโหลดรอบนี้
      status: "completed",
    }

    const webhookResponse = await fetch("https://gto.vuttinun.space/webhook/queueupdate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookData),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook error! status: ${webhookResponse.status}`)
    }

    const queueData = {
      photos: allImages, // ส่งคืน "ทั้งหมด" ของคิวนี้ (รวมของเก่าที่เคยอัปโหลด)
      status: "completed",
      completed_time: completedTime || new Date().toISOString(),
      device,
      location,
    }

    return NextResponse.json({ success: true, queue: queueData })
  } catch (error) {
    console.error("Error uploading photos:", error)
    return NextResponse.json(
      {
        error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
