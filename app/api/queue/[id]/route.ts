import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const queues = data[0]?.data || []
    const queue = queues.find((q: any) => q.name === params.id)

    if (!queue) {
      return NextResponse.json({
        name: params.id,
        status: "pending",
        photos: [],
        customer: "ไม่ระบุ",
        completed_time: null,
        device: null,
        location: null,
      })
    }

    return NextResponse.json(queue)
  } catch (error) {
    console.error("Error fetching queue:", error)
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลคิวได้", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
