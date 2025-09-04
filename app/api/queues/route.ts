import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
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
    let queues = data[0]?.data || []

    const { searchParams } = new URL(request.url)
    const driver = searchParams.get("driver")

    if (driver) {
      queues = queues.filter((q: any) => q.driver_or_messenger_name === driver)
    }

    queues.sort((a: any, b: any) => {
      const aCompleted = a.date_time ? true : false
      const bCompleted = b.date_time ? true : false

      if (aCompleted && !bCompleted) return 1
      if (!aCompleted && bCompleted) return -1

      const timeA = new Date(`${a.requested_date}T${a.requested_time_2}`).getTime()
      const timeB = new Date(`${b.requested_date}T${b.requested_time_2}`).getTime()
      return timeA - timeB
    })

    return NextResponse.json(queues)
  } catch (error) {
    console.error("Error fetching queues:", error)
    return NextResponse.json(
      { error: "ไม่สามารถดึงข้อมูลคิวได้", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
