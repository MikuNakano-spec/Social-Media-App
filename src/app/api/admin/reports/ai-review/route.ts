import { NextResponse } from "next/server";
import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { Ollama } from 'ollama';

export async function POST(req: Request) {
  try {
    const { user: currentUser } = await validateRequest();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "MODERATOR", "SUPER_ADMIN"];
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { error: "Requires ADMIN, MODERATOR, or SUPER_ADMIN role" },
        { status: 403 }
      );
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json(
        { error: "Missing report ID" },
        { status: 400 }
      );
    }

    // Fetch report with content
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        post: { select: { content: true } },
        comment: { select: { content: true } },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    const content = report.postId
      ? report.post?.content
      : report.comment?.content;

    // Handle empty content
    let fullContent = "";
    if (report.post?.content) fullContent += `POST: ${report.post.content}\n\n`;
    if (report.comment?.content) fullContent += `COMMENT: ${report.comment.content}`;
    
    // Handle empty content
    if (!fullContent.trim()) {
      return NextResponse.json({
        status: "RESOLVED",
        reason: "NO_CONTENT: No content available for analysis"
      });
    }

    // Initialize Ollama client
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    // Enhanced moderation prompt
    const response = await ollama.chat({
      model: 'mistral',
      messages: [
        {
          role: 'system',
          content: `You are a strict content moderation AI. Analyze content for VIOLATIONS based on these guidelines:
          
          ZERO-TOLERANCE VIOLATIONS (Always mark as VIOLATION):
          1. Hate speech, racism, or discrimination
          2. Threats of violence or harm
          3. Explicit sexual content or solicitation
          4. Illegal activities or substances
          5. Severe bullying or harassment
          6. Extreme violence/gore
          7. Severe profanity directed at individuals (bitch, fuck, asshole, etc.)
          8. Personal attacks or insults
          
          CONTEXTUAL VIOLATIONS (Mark as VIOLATION if severe or targeted):
          1. Mild profanity (shit, damn, etc.) when directed at someone
          2. Insults based on appearance, intelligence, etc.
          3. Harassment based on gender/identity
          
          NON-VIOLATIONS:
          1. General criticism without personal attacks
          2. Mild language not directed at individuals
          3. Political discussions without threats
          
          EXAMPLES OF VIOLATIONS:
          - "You're a fucking idiot"
          - "I'll kill you bitch"
          - "All [group] should die"
          - "[Explicit sexual content]"
          
          EXAMPLES OF NON-VIOLATIONS:
          - "This policy is shit"
          - "I'm frustrated with this situation"
          - "The weather is damn hot today"
          
          Respond in JSON format ONLY:
          { 
            "status": "VIOLATION" or "NO_VIOLATION", 
            "reason": "Brief explanation (1 sentence)",
            "severity": "LOW", "MEDIUM", or "HIGH"
          }`
        },
        {
          role: 'user',
          content: `Content to moderate: "${fullContent.substring(0, 3000)}"`
        }
      ],
      options: {
        temperature: 0.1
      }
    });

    const result = response.message?.content;
    if (!result) {
      throw new Error("Ollama returned empty response");
    }

    // Parse JSON response
    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch (e) {
      // Handle cases where Ollama doesn't return pure JSON
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsedResult = JSON.parse(match[0]);
        } catch (parseError) {
          throw new Error("Invalid JSON response after extraction");
        }
      } else {
        throw new Error("Invalid JSON response: no JSON object found");
      }
    }

    // Validate response
    if (!parsedResult.status || !["VIOLATION", "NO_VIOLATION"].includes(parsedResult.status)) {
      throw new Error("Invalid status from Ollama: " + parsedResult.status);
    }

    // Determine new status based on AI analysis
    const newStatus = parsedResult.status === "VIOLATION" 
      ? ReportStatus.REVIEWED 
      : ReportStatus.RESOLVED;

    // Update report status
    await prisma.report.update({
      where: { id },
      data: { status: newStatus }
    });

    return NextResponse.json({
      status: parsedResult.status,
      reason: `${parsedResult.status}: ${parsedResult.reason}`
    });

  } catch (error) {
    console.error("Ollama review error:", error);
    return NextResponse.json(
      { 
        status: "ERROR",
        reason: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}