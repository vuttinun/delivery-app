import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const customer = formData.get("customer") as string
    const address = formData.get("address") as string
    const noteToShipper = formData.get("note_to_shipper") as string
    const latitude = formData.get("latitude") as string
    const longitude = formData.get("longitude") as string
    const driverName = formData.get("driver_or_messenger_name") as string
    const requestedDate = formData.get("requested_date") as string
    const requestedTime = formData.get("requested_time") as string
    const files = formData.getAll("photos") as File[]

    if (!customer || !address || !driverName) {
      return NextResponse.json({ error: "กรุณาระบุชื่อสถานที่, ที่อยู่, และชื่อคนขับ" }, { status: 400 })
    }

    const imageUrls: string[] = []
    for (const file of files) {
      if (file instanceof File) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString("base64")
        const dataUrl = `data:${file.type};base64,${base64}`
        imageUrls.push(dataUrl)
      }
    }

    const queueData = {
      customer,
      address,
      note_to_shipper: noteToShipper || null,
      latitude: latitude || "-",
      longitude: longitude || "-",
      driver_or_messenger_name: driverName,
      requested_date: requestedDate || new Date().toISOString().split("T")[0],
      requested_time: requestedTime || "09:00:00",
      requested_time_2: "17:30:00",
      assign_to_name: "มัณฑนา",
      sales_phone_number: "168",
      custom_list: "งานใหม่",
      contact_person_name: "ไม่ระบุ",
      phone_number: "ไม่ระบุ",
      status: "pending",
      photos: imageUrls,
      date_time: null,
    }

    let webhookResult: any = null
    let queueName = `Q${Date.now()}`

    try {
      const webhookResponse = await fetch("https://gto.vuttinun.space/webhook/createqueue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queueData),
      })

      if (!webhookResponse.ok) {
        console.warn(`Webhook error! status: ${webhookResponse.status}`)
      } else {
        // Check if response has content before parsing JSON
        const responseText = await webhookResponse.text()
        if (responseText.trim()) {
          try {
            webhookResult = JSON.parse(responseText)
            queueName = webhookResult.name || queueName
          } catch (parseError) {
            console.warn("Failed to parse webhook response as JSON:", parseError)
            // Continue with default queue name
          }
        }
      }
    } catch (webhookError) {
      console.warn("Webhook request failed:", webhookError)
      // Continue without webhook - create queue locally
    }

    const newQueue = {
      ...queueData,
      name: queueName,
    }

    return NextResponse.json(newQueue)
  } catch (error) {
    console.error("Error creating queue:", error)
    return NextResponse.json(
      { error: "ไม่สามารถสร้างคิวใหม่ได้", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
