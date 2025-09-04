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
    const queues = data[0]?.data || []

    const drivers = [
      ...new Set(
        queues.map((q: any) => q.driver_or_messenger_name).filter((name: string) => name && name.trim() !== ""),
      ),
    ]

    return NextResponse.json(drivers)
  } catch (error) {
    console.error("Error fetching drivers:", error)
    return NextResponse.json(
      { error: "ไม่สามารถดึงรายชื่อคนขับได้", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
