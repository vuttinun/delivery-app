import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("photos") as File[]
    const completedTime = formData.get("completed_time") as string
    const device = formData.get("device") as string
    const location = formData.get("location") as string

    const imageUrls: string[] = []
    for (const file of files) {
      if (file instanceof File) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const randomString = Math.random().toString(36).substring(2, 8)
        const fileExtension = file.name.split(".").pop() || "jpg"
        const filename = `${params.id}-${timestamp}-${randomString}.${fileExtension}`

        // Upload to Vercel Blob
        const blob = await put(filename, file, {
          access: "public",
        })

        imageUrls.push(blob.url)
      }
    }

    const existingImages = JSON.parse(localStorage.getItem(`queue-${params.id}-images`) || "[]")
    const allImages = [...existingImages, ...imageUrls]
    localStorage.setItem(`queue-${params.id}-images`, JSON.stringify(allImages))

    const webhookData = {
      doctype: "Queue Request",
      docname: params.id,
      imageUrls: imageUrls,
      status: "completed",
    }

    const webhookResponse = await fetch("https://gto.vuttinun.space/webhook/queueupdate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook error! status: ${webhookResponse.status}`)
    }

    const queueData = {
      photos: allImages, // Return all images including previously uploaded ones
      status: "completed",
      completed_time: completedTime || new Date().toISOString(),
      device: device || "Unknown",
      location: location || null,
    }

    return NextResponse.json({ success: true, queue: queueData })
  } catch (error) {
    console.error("Error uploading photos:", error)
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
