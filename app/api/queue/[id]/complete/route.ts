import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { queueName, completedBy, completedAt, images, latitude, longitude } = body

    console.log("[v0] Completing job:", {
      queueName,
      completedBy,
      completedAt,
      latitude,
      longitude,
      imageCount: images?.length || 0,
    })

    // Here you would typically update your database
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: "Job completed successfully",
      data: {
        queueName,
        completedBy,
        completedAt,
        latitude,
        longitude,
      },
    })
  } catch (error) {
    console.error("[v0] Error completing job:", error)
    return NextResponse.json({ error: "Failed to complete job" }, { status: 500 })
  }
}
