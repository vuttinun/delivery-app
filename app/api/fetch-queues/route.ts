import { NextResponse } from "next/server"

export async function GET() {
  try {
    const response = await fetch("https://gto.vuttinun.space/webhook/queuerequest", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const queues =
      data[0]?.data?.map((queue: any) => ({
        ...queue,
        status: queue.date_time ? "completed" : "pending",
        photos: queue.photos || [],
        completed_time: queue.date_time || null,
        device: queue.device || null,
        location: queue.location || null,
      })) || []

    return NextResponse.json(queues)
  } catch (error) {
    console.error("Error fetching queues from API:", error)
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลคิวได้จาก API", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
